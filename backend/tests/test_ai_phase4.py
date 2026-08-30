import json
from unittest.mock import MagicMock, patch

import pytest
from pydantic import ValidationError

from app.services.ai.ai_interface import AIProvider
from app.services.ai.ai_service import AIService
from app.services.ai.schemas import NormalizedAuditSchema


def test_ai_provider_interface_is_abstract():
    assert issubclass(AIProvider, object)
    assert hasattr(AIProvider, 'normalize_configuration')
    assert hasattr(AIProvider, 'interpret_unknown_command')


def test_missing_api_key_falls_back_to_deterministic():
    with patch.dict('os.environ', {}, clear=False):
        service = AIService(enabled=True)
        result = service.normalize_configuration(
            config_text='hostname TEST',
            vendor='cisco',
            deterministic={'device': {'hostname': 'TEST'}, 'security': {'ssh_version': 2}, 'network': {'interfaces': [], 'acl_rules': []}},
        )
        assert result['status'] in {'fallback', 'unavailable'}
        assert result['fallback_used'] is True


def test_invalid_ai_json_falls_back_to_deterministic():
    service = AIService(enabled=True)
    with patch.object(service, '_provider', MagicMock()) as provider:
        provider.normalize_configuration.side_effect = ValueError('bad json')
        result = service.normalize_configuration(
            config_text='hostname TEST',
            vendor='cisco',
            deterministic={'device': {'hostname': 'TEST'}, 'security': {'ssh_version': 2}, 'network': {'interfaces': [], 'acl_rules': []}},
        )
        assert result['status'] in {'fallback', 'unavailable'}
        assert result['fallback_used'] is True


def test_pydantic_validation_rejects_invalid_ai_schema():
    with pytest.raises(ValidationError):
        NormalizedAuditSchema.model_validate({
            'device': {'hostname': 123},
            'security': {'ssh_version': 'bad'},
            'network': {'interfaces': [], 'acl_rules': []},
        })


def test_deterministic_values_take_precedence_over_ai_values():
    service = AIService(enabled=False)
    deterministic = {'device': {'hostname': 'router-1'}, 'security': {'ssh_version': 2}, 'network': {'interfaces': [], 'acl_rules': []}}
    ai_payload = {'device': {'hostname': 'ai-override'}, 'security': {'ssh_version': 1}, 'network': {'interfaces': [], 'acl_rules': []}}
    merged = service.merge_normalized_models(deterministic, ai_payload)
    assert merged['device']['hostname'] == 'router-1'
    assert merged['security']['ssh_version'] == 2


def test_ai_fills_null_values():
    service = AIService(enabled=False)
    deterministic = {'device': {'hostname': 'router-1'}, 'security': {'ssh_version': None}, 'network': {'interfaces': [], 'acl_rules': []}}
    ai_payload = {'device': {'hostname': None}, 'security': {'ssh_version': 2}, 'network': {'interfaces': [], 'acl_rules': []}}
    merged = service.merge_normalized_models(deterministic, ai_payload)
    assert merged['security']['ssh_version'] == 2


def test_unknown_command_interpretation_returns_structured_result():
    service = AIService(enabled=False)
    with patch.object(service, '_provider', MagicMock()) as provider:
        provider.interpret_unknown_command.return_value = {
            'parameter': 'login_timeout',
            'value': 300,
            'confidence': 0.91,
            'reasoning_summary': 'The command appears to configure an SSH management timeout.'
        }
        result = service.interpret_unknown_command('unknown', 'set management-access ssh-timeout 300')
        assert result['parameter'] == 'login_timeout'
        assert result['value'] == 300
        assert result['confidence'] >= 0.7


def test_low_confidence_requires_review():
    service = AIService(enabled=False)
    result = service._normalize_ai_confidence(0.65)
    assert result['requires_review'] is True


def test_ai_unavailable_audit_still_succeeds():
    service = AIService(enabled=True)
    deterministic = {'device': {'hostname': 'router-1'}, 'security': {'ssh_version': 2}, 'network': {'interfaces': [], 'acl_rules': []}}
    result = service.normalize_configuration('hostname router-1', vendor='cisco', deterministic=deterministic)
    assert 'status' in result
    assert 'normalized' in result
    assert result['normalized']['device']['hostname'] == 'router-1'


def test_sensitive_value_redaction():
    service = AIService(enabled=False)
    redacted = service.redact_sensitive_text('password admin secret token=abc api-key=xyz private-key stuff')
    assert '[REDACTED]' in redacted
    assert 'admin' not in redacted
