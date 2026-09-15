from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes.audits import AnalysisOptions, analyze_audit
from app.api.routes.training import list_unknown_commands
from app.core.database import Base
from app.db.audit_repository import AuditRepository
from app.db.models import LearnedMapping, UnknownCommand
from app.services.training.learning_engine import LearningEngine
from app.services.compliance.engine import evaluate
from app.services.parsers.normalizer import normalize_security_data
from app.services.parsers.vendor_detector import detect_vendor
from app.services.parsers.fortios_parser import parse_fortios_config
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User
from app.db.models import User


VALID_PARAMETERS = {
    'login_timeout',
    'ssh_version',
    'telnet_enabled',
    'http_enabled',
    'https_enabled',
    'logging_enabled',
    'ntp_configured',
    'snmp_secure',
    'password_policy',
}


def test_create_and_retrieve_mapping():
    engine = LearningEngine()
    mapping = engine.create_mapping(
        vendor='unknown',
        command_pattern='ssh-timeout',
        normalized_parameter='login_timeout',
        value_type='integer',
        description='Management SSH timeout',
    )
    assert mapping['normalized_parameter'] == 'login_timeout'
    assert mapping['enabled'] is True
    mappings = engine.list_mappings()
    assert any(item['normalized_parameter'] == 'login_timeout' for item in mappings)


def test_disable_mapping():
    engine = LearningEngine()
    mapping = engine.create_mapping(
        vendor='unknown',
        command_pattern='ssh-timeout',
        normalized_parameter='login_timeout',
        value_type='integer',
    )
    result = engine.disable_mapping(mapping['id'])
    assert result['enabled'] is False


def test_match_learned_command():
    engine = LearningEngine()
    engine.create_mapping(vendor='unknown', command_pattern='ssh-timeout', normalized_parameter='login_timeout', value_type='integer')
    result = engine.apply_pattern('set management-access ssh-timeout 300')
    assert result['parameter'] == 'login_timeout'
    assert result['value'] == 300
    assert result['source'] == 'learned_mapping'


# ============================================================================
# Phase 5 Regression Tests: Cleanup & Pollution Prevention
# ============================================================================

def test_disabled_mapping_not_returned_by_list():
    """Disabled mappings should not appear in GET /api/training/mappings."""
    engine = LearningEngine()
    
    # Create two mappings
    mapping1 = engine.create_mapping(
        vendor='cisco',
        command_pattern='service timestamps debug datetime msec',
        normalized_parameter='logging_enabled',
        value_type='boolean',
    )
    mapping2 = engine.create_mapping(
        vendor='cisco',
        command_pattern='ssh-timeout',
        normalized_parameter='login_timeout',
        value_type='integer',
    )
    
    # Disable the first mapping
    engine.disable_mapping(mapping1['id'])
    
    # List should only return the enabled mapping
    mappings = engine.list_mappings()
    assert len(mappings) == 1
    assert mappings[0]['normalized_parameter'] == 'login_timeout'
    assert mappings[0]['id'] == mapping2['id']


def test_disabled_mapping_not_applied():
    """Disabled mappings should not match during pattern application."""
    engine = LearningEngine()
    
    # Create and disable a mapping
    mapping = engine.create_mapping(
        vendor='cisco',
        command_pattern='service timestamps',
        normalized_parameter='logging_enabled',
        value_type='boolean',
    )
    engine.disable_mapping(mapping['id'])
    
    # Pattern match should return None for disabled mapping
    result = engine.apply_pattern('service timestamps debug datetime msec')
    assert result is None


def test_unknown_parameter_mapping_is_invalid():
    """Mappings with normalized_parameter='unknown' should fail validation."""
    engine = LearningEngine()
    
    try:
        engine.create_mapping(
            vendor='cisco',
            command_pattern='some command',
            normalized_parameter='unknown',
            value_type='string',
        )
        # Should not reach here
        assert False, "Expected ValueError for unsupported parameter"
    except ValueError as e:
        assert 'Unsupported normalized parameter' in str(e)


def test_audit_parse_does_not_auto_create_mapping():
    """Running an audit should NOT automatically create learned mappings.
    
    Only explicit POST /api/training/mapping should create mappings.
    apply_pattern() is only called to resolve against EXISTING mappings.
    """
    engine = LearningEngine()
    
    # Simulate audit parsing of unknown command
    config = """
    set management-access ssh-timeout 300
    set system hostname test-device
    """
    
    detection = detect_vendor(config)
    vendor = detection['vendor']
    
    # Parse returns unknown commands
    parsed = parse_fortios_config(config)
    unknown_cmds = parsed.get('unknown_commands', [])
    
    # Before mapping exists, resolve returns None
    for cmd in unknown_cmds:
        result = engine.resolve_unknown_command(str(cmd))
        # Should return None since no mapping exists yet
        assert result is None
    
    # Verify no mappings were auto-created
    mappings = engine.list_mappings()
    assert len(mappings) == 0


def test_only_explicit_admin_action_creates_mapping():
    """Only POST /api/training/mapping (explicit admin action) should create mappings."""
    engine = LearningEngine()
    
    # Simulate admin explicitly creating a mapping via Training Center UI
    # This is the ONLY way mappings should be created
    mapping = engine.create_mapping(
        vendor='fortinet',
        command_pattern='set management-access ssh-timeout',
        normalized_parameter='login_timeout',
        value_type='integer',
        description='SSH management timeout for Fortinet devices',
    )
    
    # Verify mapping was created with explicit admin data
    assert mapping is not None
    assert mapping['normalized_parameter'] == 'login_timeout'
    assert mapping['vendor'] == 'fortinet'
    assert mapping['enabled'] is True
    
    # Now when audit encounters same command, it matches the learned mapping
    result = engine.apply_pattern('set management-access ssh-timeout 300')
    assert result is not None
    assert result['parameter'] == 'login_timeout'
    assert result['value'] == 300


def test_learned_mapping_reused_across_audits():
    """Once a mapping is learned, it should be reused in future audits.
    
    Workflow:
    1. Audit 1: Unknown command → Admin creates mapping
    2. Audit 2: Same command → Resolved using learned mapping
    """
    engine = LearningEngine()
    
    # Audit 1: Admin learns the mapping
    mapping = engine.create_mapping(
        vendor='fortinet',
        command_pattern='ssh-timeout',
        normalized_parameter='login_timeout',
        value_type='integer',
        description='SSH timeout learning',
    )
    assert mapping['enabled'] is True
    
    # Audit 2: Same command should resolve via learned mapping
    result = engine.apply_pattern('set management-access ssh-timeout 300')
    assert result is not None
    assert result['source'] == 'learned_mapping'
    assert result['parameter'] == 'login_timeout'
    assert result['value'] == 300


def test_valid_learned_mapping_preserved():
    """Legitimate admin-created mappings should be preserved and active."""
    engine = LearningEngine()
    
    # Create a legitimate mapping (ssh-timeout → login_timeout)
    mapping = engine.create_mapping(
        vendor='fortinet',
        command_pattern='ssh-timeout',
        normalized_parameter='login_timeout',
        value_type='integer',
        description='SSH management timeout',
        confidence=0.95,
        enabled=True,
    )
    
    # Verify it's in the active list
    mappings = engine.list_mappings()
    assert any(m['normalized_parameter'] == 'login_timeout' for m in mappings)
    
    # Verify it applies during pattern matching
    result = engine.apply_pattern('set management-access ssh-timeout 300')
    assert result is not None
    assert result['parameter'] == 'login_timeout'
    assert result['value'] == 300
    assert result['source'] == 'learned_mapping'


def test_supported_parameters_are_enforced():
    """Only supported parameters should be allowed in learned mappings."""
    engine = LearningEngine()
    
    supported = [
        'ssh_enabled', 'ssh_version', 'telnet_enabled', 'http_enabled',
        'https_enabled', 'logging_enabled', 'ntp_configured', 'snmp_secure',
        'login_timeout', 'password_policy', 'hostname', 'vendor', 'model',
        'serial_number', 'os_version',
    ]
    
    # All supported parameters should work
    for i, param in enumerate(supported):
        mapping = engine.create_mapping(
            vendor='test',
            command_pattern=f'test-pattern-{i}',
            normalized_parameter=param,
            value_type='string',
        )
        assert mapping['normalized_parameter'] == param
    
    # Unsupported should fail
    try:
        engine.create_mapping(
            vendor='test',
            command_pattern='test',
            normalized_parameter='invalid_parameter_xyz',
            value_type='string',
        )
        assert False, "Should have raised ValueError"
    except ValueError:
        pass  # Expected


def test_extract_integer_value():
    engine = LearningEngine()
    result = engine.extract_value('integer', '300')
    assert result == 300


def test_extract_boolean_value():
    engine = LearningEngine()
    assert engine.extract_value('boolean', 'yes') is True
    assert engine.extract_value('boolean', 'no') is False


def test_learned_mapping_resolves_unknown_command():
    engine = LearningEngine()
    engine.create_mapping(vendor='unknown', command_pattern='ssh-timeout', normalized_parameter='login_timeout', value_type='integer')
    result = engine.resolve_unknown_command('set management-access ssh-timeout 300')
    assert result['parameter'] == 'login_timeout'
    assert result['value'] == 300


def test_deterministic_parser_takes_precedence():
    engine = LearningEngine()
    deterministic = {'security': {'ssh_version': 2}}
    ai_result = {'security': {'ssh_version': 1}}
    learned_result = {'security': {'ssh_version': 3}}
    merged = engine.merge_with_priority(deterministic, learned_result, ai_result)
    assert merged['security']['ssh_version'] == 2


def test_ai_suggestion_does_not_become_mapping():
    engine = LearningEngine()
    result = engine.ai_suggestion_is_approved({'parameter': 'login_timeout', 'value': 300}, approved=False)
    assert result is False


def test_saved_mapping_is_reused_on_future_audit():
    engine = LearningEngine()
    engine.create_mapping(vendor='unknown', command_pattern='ssh-timeout', normalized_parameter='login_timeout', value_type='integer')
    repeated = engine.apply_pattern('set management-access ssh-timeout 600')
    assert repeated['value'] == 600


def test_invalid_normalized_parameter_rejected():
    engine = LearningEngine()
    try:
        engine.create_mapping(vendor='unknown', command_pattern='ssh-timeout', normalized_parameter='bad_field', value_type='integer')
        assert False
    except ValueError:
        assert True


def test_disabled_mapping_is_not_used():
    engine = LearningEngine()
    mapping = engine.create_mapping(vendor='unknown', command_pattern='ssh-timeout', normalized_parameter='login_timeout', value_type='integer')
    engine.disable_mapping(mapping['id'])
    result = engine.apply_pattern('set management-access ssh-timeout 300')
    assert result is None


def test_duplicate_mapping_handled_safely():
    engine = LearningEngine()
    first = engine.create_mapping(vendor='unknown', command_pattern='ssh-timeout', normalized_parameter='login_timeout', value_type='integer')
    second = engine.create_mapping(vendor='unknown', command_pattern='ssh-timeout', normalized_parameter='login_timeout', value_type='integer')
    assert second['id'] == first['id']
    assert engine.db.query(LearnedMapping).count() == 1


def test_explicit_mapping_resolves_matching_historical_unknowns_only():
    engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    repository = AuditRepository(db, user_id=1)
    learned_command = 'set management-access custom-timeout 450'
    unrelated_command = 'set management-access idle-banner enabled'

    for audit_number in range(14, 19):
        audit = repository.create_audit_record(title=f'historical_unknown_{audit_number}.txt')
        repository.save_unknown_commands(
            audit_id=audit.id,
            device_id=None,
            commands=[{'command': learned_command, 'vendor': 'cisco', 'line_number': audit_number}],
        )

    unrelated_audit = repository.create_audit_record(title='historical_unrelated_unknown.txt')
    repository.save_unknown_commands(
        audit_id=unrelated_audit.id,
        device_id=None,
        commands=[{'command': unrelated_command, 'vendor': 'cisco', 'line_number': 90}],
    )

    assert len(repository.list_unknown_commands()) == 6

    training_engine = LearningEngine(db)
    mapping = training_engine.create_mapping(
        vendor='cisco',
        command_pattern=learned_command,
        normalized_parameter='login_timeout',
        value_type='integer',
        description='Custom management timeout',
    )

    visible_unknowns = repository.list_unknown_commands()
    assert len(visible_unknowns) == 1
    assert visible_unknowns[0]['command'] == unrelated_command

    matching_records = db.query(UnknownCommand).filter(UnknownCommand.command == learned_command).all()
    assert len(matching_records) == 5
    assert all(record.resolved for record in matching_records)
    assert all(record.resolved_by_mapping_id == mapping['id'] for record in matching_records)
    assert all(record.resolved_at is not None for record in matching_records)

    unrelated_record = db.query(UnknownCommand).filter(UnknownCommand.command == unrelated_command).one()
    assert unrelated_record.resolved is False


def test_analyze_unknown_command_persists_for_training_center(tmp_path, monkeypatch):
    import asyncio

    engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    repository = AuditRepository(db, user_id=1)
    audit = repository.create_audit_record(title='training_test_unknown.txt')

    config_text = '''
    hostname R1
    ip ssh version 2
    set management-access custom-timeout 450
    '''

    import app.api.routes.audits as audits_module
    monkeypatch.setattr(audits_module, 'UPLOAD_DIR', tmp_path)
    upload_path = tmp_path / f'{audit.id}_{audit.title}'
    upload_path.write_text(config_text, encoding='utf-8')

    response = asyncio.run(
        analyze_audit(
            audit_id=audit.id,
            options=AnalysisOptions(ai_enabled=False),
            db=db,
            current_user=User(id=1, name="test", email="test@test.com", password_hash="hash")
        )
    )

    assert response['unknown_commands']
    assert any(item.get('command') == 'set management-access custom-timeout 450' for item in response['unknown_commands'])

    stored = asyncio.run(list_unknown_commands(db=db, current_user=User(id=1, name='test', email='test@test.com', password_hash='hash')))
    assert any(item.get('command') == 'set management-access custom-timeout 450' for item in stored)

    # Re-running analysis for the same audit should not duplicate the unresolved record unnecessarily.
    response_2 = asyncio.run(
        analyze_audit(
            audit_id=audit.id,
            options=AnalysisOptions(ai_enabled=False),
            db=db,
            current_user=User(id=1, name="test", email="test@test.com", password_hash="hash")
        )
    )
    stored_2 = asyncio.run(list_unknown_commands(db=db, current_user=User(id=1, name='test', email='test@test.com', password_hash='hash')))
    assert len(stored_2) == len(stored)
    assert any(item.get('command') == 'set management-access custom-timeout 450' for item in stored_2)
    assert not any(item.get('command') and item.get('command') == 'set management-access custom-timeout 450' and item.get('vendor') == 'unknown' for item in LearningEngine(db).list_mappings())


def test_active_learned_mapping_resolves_command_and_removes_from_unknown(tmp_path, monkeypatch):
    import asyncio

    engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    repository = AuditRepository(db, user_id=1)
    audit = repository.create_audit_record(title='training_test_unknown.txt')

    config_text = '''
    hostname R1
    ip ssh version 2
    set management-access custom-timeout 450
    '''

    import app.api.routes.audits as audits_module
    monkeypatch.setattr(audits_module, 'UPLOAD_DIR', tmp_path)
    upload_path = tmp_path / f'{audit.id}_{audit.title}'
    upload_path.write_text(config_text, encoding='utf-8')

    training_engine = LearningEngine(db)
    training_engine.create_mapping(
        vendor='cisco',
        command_pattern='set management-access custom-timeout 450',
        normalized_parameter='login_timeout',
        value_type='integer',
        enabled=True,
    )

    assert len(training_engine.list_mappings()) == 1

    response = asyncio.run(
        analyze_audit(
            audit_id=audit.id,
            options=AnalysisOptions(ai_enabled=False),
            db=db,
            current_user=User(id=1, name="test", email="test@test.com", password_hash="hash")
        )
    )

    assert response['security']['login_timeout'] == 450
    assert not any(item.get('command') == 'set management-access custom-timeout 450' for item in response['unknown_commands'])
    assert len(training_engine.list_mappings()) == 1


def test_disabled_mapping_does_not_resolve_unknown_command(tmp_path, monkeypatch):
    import asyncio

    engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    repository = AuditRepository(db, user_id=1)
    audit = repository.create_audit_record(title='training_test_unknown_disabled.txt')

    config_text = '''
    hostname R1
    ip ssh version 2
    set management-access custom-timeout 450
    '''

    import app.api.routes.audits as audits_module
    monkeypatch.setattr(audits_module, 'UPLOAD_DIR', tmp_path)
    upload_path = tmp_path / f'{audit.id}_{audit.title}'
    upload_path.write_text(config_text, encoding='utf-8')

    training_engine = LearningEngine(db)
    mapping = training_engine.create_mapping(
        vendor='cisco',
        command_pattern='set management-access custom-timeout 450',
        normalized_parameter='login_timeout',
        value_type='integer',
        enabled=True,
    )
    training_engine.disable_mapping(mapping['id'])

    response = asyncio.run(
        analyze_audit(
            audit_id=audit.id,
            options=AnalysisOptions(ai_enabled=False),
            db=db,
            current_user=User(id=1, name="test", email="test@test.com", password_hash="hash")
        )
    )

    assert response['security']['login_timeout'] is None
    assert any(item.get('command') == 'set management-access custom-timeout 450' for item in response['unknown_commands'])


def test_deterministic_value_preserves_priority_over_learned_mapping(tmp_path, monkeypatch):
    import asyncio

    engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    repository = AuditRepository(db, user_id=1)
    audit = repository.create_audit_record(title='training_test_deterministic_priority.txt')

    config_text = '''
    hostname R1
    ip ssh time-out 300
    set management-access custom-timeout 450
    '''

    import app.api.routes.audits as audits_module
    monkeypatch.setattr(audits_module, 'UPLOAD_DIR', tmp_path)
    upload_path = tmp_path / f'{audit.id}_{audit.title}'
    upload_path.write_text(config_text, encoding='utf-8')

    training_engine = LearningEngine(db)
    training_engine.create_mapping(
        vendor='cisco',
        command_pattern='set management-access custom-timeout 450',
        normalized_parameter='login_timeout',
        value_type='integer',
        enabled=True,
    )

    response = asyncio.run(
        analyze_audit(
            audit_id=audit.id,
            options=AnalysisOptions(ai_enabled=False),
            db=db,
            current_user=User(id=1, name="test", email="test@test.com", password_hash="hash")
        )
    )

    assert response['security']['login_timeout'] == 300
    assert any(item.get('command') == 'set management-access custom-timeout 450' for item in response['unknown_commands'])


def test_unknown_command_does_not_create_mapping_but_explicit_admin_mapping_does():
    engine = create_engine('sqlite:///:memory:', connect_args={'check_same_thread': False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    repository = AuditRepository(db, user_id=1)
    audit = repository.create_audit_record(title='custom_timeout_unknown.txt')
    command = {'command': 'set management-access custom-timeout 450', 'vendor': 'cisco', 'line_number': 6}
    repository.save_unknown_commands(audit_id=audit.id, device_id=None, commands=[command])

    stored = repository.list_unknown_commands()
    assert len(stored) == 1
    assert stored[0]['command'] == 'set management-access custom-timeout 450'

    training_engine = LearningEngine(db)
    assert training_engine.list_mappings() == []

    mapping = training_engine.create_mapping(
        vendor='cisco',
        command_pattern='set management-access custom-timeout',
        normalized_parameter='login_timeout',
        value_type='integer',
        description='Custom timeout',
    )
    assert mapping['normalized_parameter'] == 'login_timeout'
    assert any(item['normalized_parameter'] == 'login_timeout' for item in training_engine.list_mappings())

    result = training_engine.apply_pattern('set management-access custom-timeout 600')
    assert result is not None
    assert result['parameter'] == 'login_timeout'
    assert result['value'] == 600
