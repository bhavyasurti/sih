from __future__ import annotations

import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, SessionLocal
from app.db.init_db import init_db
from app.db.models import LearnedMapping, UnknownCommand

SUPPORTED_PARAMETERS = {
    'ssh_enabled',
    'ssh_version',
    'telnet_enabled',
    'http_enabled',
    'https_enabled',
    'logging_enabled',
    'ntp_configured',
    'snmp_secure',
    'login_timeout',
    'password_policy',
    'hostname',
    'vendor',
    'model',
    'serial_number',
    'os_version',
}


class LearningEngine:
    def __init__(self, db_session=None):
        init_db()
        if db_session is not None:
            self.db = db_session
            return

        db_dir = Path(__file__).resolve().parents[2] / 'data'
        db_dir.mkdir(parents=True, exist_ok=True)
        db_path = db_dir / f'training_{uuid.uuid4().hex}.db'
        test_engine = create_engine(f'sqlite:///{db_path}', connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=test_engine)
        self.db = sessionmaker(bind=test_engine)()

    def validate_normalized_parameter(self, parameter: str) -> bool:
        return parameter in SUPPORTED_PARAMETERS

    def _mapping_key(
        self,
        vendor: str,
        command_pattern: str,
        normalized_parameter: str,
        value_type: str,
    ) -> tuple[str, str, str, str]:
        return (
            str(vendor or 'unknown').strip().lower(),
            str(command_pattern or '').strip().lower(),
            str(normalized_parameter or '').strip().lower(),
            str(value_type or 'string').strip().lower(),
        )

    def _stored_mapping_key(self, mapping: LearnedMapping) -> tuple[str, str, str, str]:
        command_pattern = getattr(mapping, 'command_pattern', None) or getattr(mapping, 'raw_command', '')
        normalized_parameter = getattr(mapping, 'normalized_parameter', None) or getattr(mapping, 'normalized_control', '')
        value_type = getattr(mapping, 'value_type', 'string')
        return self._mapping_key(mapping.vendor, command_pattern, normalized_parameter, value_type)

    def _find_duplicate_mapping(
        self,
        vendor: str,
        command_pattern: str,
        normalized_parameter: str,
        value_type: str,
    ) -> LearnedMapping | None:
        requested_key = self._mapping_key(vendor, command_pattern, normalized_parameter, value_type)
        for mapping in self.db.query(LearnedMapping).all():
            if self._stored_mapping_key(mapping) == requested_key:
                return mapping
        return None

    def _mapping_response(self, mapping: LearnedMapping) -> dict[str, Any]:
        return {
            'id': mapping.id,
            'vendor': mapping.vendor,
            'command_pattern': getattr(mapping, 'command_pattern', None) or mapping.raw_command,
            'normalized_parameter': getattr(mapping, 'normalized_parameter', None) or mapping.normalized_control,
            'value_type': getattr(mapping, 'value_type', 'string'),
            'description': getattr(mapping, 'description', ''),
            'confidence': getattr(mapping, 'confidence', 1.0),
            'enabled': bool(getattr(mapping, 'enabled', True)),
        }

    def create_mapping(
        self,
        vendor: str,
        command_pattern: str,
        normalized_parameter: str,
        value_type: str,
        description: str | None = None,
        confidence: float = 1.0,
        enabled: bool = True,
    ) -> dict[str, Any] | None:
        vendor = str(vendor or 'unknown').strip() or 'unknown'
        command_pattern = str(command_pattern or '').strip()
        normalized_parameter = str(normalized_parameter or '').strip()
        value_type = str(value_type or 'string').strip() or 'string'

        if not self.validate_normalized_parameter(normalized_parameter):
            raise ValueError(f'Unsupported normalized parameter: {normalized_parameter}')

        existing_mapping = self._find_duplicate_mapping(vendor, command_pattern, normalized_parameter, value_type)
        if existing_mapping is not None:
            existing_mapping.raw_command = command_pattern
            existing_mapping.command_pattern = command_pattern
            existing_mapping.normalized_control = normalized_parameter
            existing_mapping.normalized_parameter = normalized_parameter
            existing_mapping.value_type = value_type
            if description is not None:
                existing_mapping.description = description
            existing_mapping.confidence = confidence
            existing_mapping.enabled = enabled
            if hasattr(existing_mapping, 'updated_at'):
                existing_mapping.updated_at = datetime.utcnow()

            self.db.commit()
            self.db.refresh(existing_mapping)
            self.resolve_unknown_commands_for_mapping(existing_mapping)
            return self._mapping_response(existing_mapping)

        mapping = LearnedMapping(
            vendor=vendor,
            raw_command=command_pattern,
            command_pattern=command_pattern,
            normalized_control=normalized_parameter,
            normalized_parameter=normalized_parameter,
            value_type=value_type,
            description=description or '',
            confidence=confidence,
            enabled=enabled,
            framework='CIS',
            administrator='system',
        )
        if hasattr(mapping, 'updated_at'):
            mapping.updated_at = datetime.utcnow()

        self.db.add(mapping)
        self.db.commit()
        self.db.refresh(mapping)
        self.resolve_unknown_commands_for_mapping(mapping)

        return self._mapping_response(mapping)

    def list_mappings(self) -> list[dict[str, Any]]:
        mappings = self.db.query(LearnedMapping).filter(LearnedMapping.enabled == True).all()
        items = []
        for mapping in mappings:
            items.append(self._mapping_response(mapping))
        return items

    def disable_mapping(self, mapping_id: int) -> dict[str, Any]:
        mapping = self.db.query(LearnedMapping).filter(LearnedMapping.id == mapping_id).first()
        if mapping is None:
            raise ValueError(f'Mapping {mapping_id} not found')

        if hasattr(mapping, 'enabled'):
            mapping.enabled = False
        if hasattr(mapping, 'updated_at'):
            mapping.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(mapping)
        return {'id': mapping.id, 'enabled': bool(getattr(mapping, 'enabled', False))}

    def delete_mapping(self, mapping_id: int) -> None:
        mapping = self.db.query(LearnedMapping).filter(LearnedMapping.id == mapping_id).first()
        if mapping is not None:
            self.db.delete(mapping)
            self.db.commit()

    def extract_value(self, value_type: str, raw_value: Any) -> Any:
        value = str(raw_value).strip()
        lower = value.lower()

        if value_type == 'integer':
            match = re.search(r'-?\d+', value)
            return int(match.group(0)) if match else None
        if value_type == 'boolean':
            if lower in {'true', 'yes', 'enabled', 'allow', 'allowall', 'on'}:
                return False
            if lower in {'false', 'no', 'disabled', 'deny', 'off'}:
                return False
            return False
        if value_type == 'enum':
            return value
        if value_type == 'string':
            return value
        return value

    def _apply_mapping_to_command(self, mapping: LearnedMapping, command: str) -> dict[str, Any] | None:
        if command is None:
            return None

        command_text = str(command).strip()
        if not command_text:
            return None

        if hasattr(mapping, 'enabled') and mapping.enabled is False:
            return None

        raw_pattern = getattr(mapping, 'command_pattern', None) or getattr(mapping, 'raw_command', '')
        if not raw_pattern:
            return None

        pattern_text = str(raw_pattern).strip()
        if pattern_text.lower() not in command_text.lower():
            return None

        parameter = getattr(mapping, 'normalized_parameter', None) or mapping.normalized_control
        value_type = getattr(mapping, 'value_type', 'string')

        raw_value = 'unknown'
        if command_text.lower() == pattern_text.lower():
            tokens = command_text.split()
            raw_value = tokens[-1] if len(tokens) > 1 else 'unknown'
        else:
            exact_match = re.match(rf'^{re.escape(pattern_text)}(?:\s+(.+))?$', command_text, flags=re.IGNORECASE)
            if exact_match and exact_match.group(1):
                raw_value = exact_match.group(1).strip()
            else:
                suffix_match = re.search(rf'{re.escape(pattern_text)}\s+(.+)', command_text, flags=re.IGNORECASE)
                if suffix_match:
                    raw_value = suffix_match.group(1).strip()
                else:
                    raw_value = 'unknown'

        value = self.extract_value(value_type, raw_value)
        if value is None:
            return None

        return {
            'parameter': parameter,
            'value': value,
            'source': 'learned_mapping',
            'confidence': getattr(mapping, 'confidence', 1.0),
        }

    def apply_pattern(self, command: str) -> dict[str, Any] | None:
        mappings = self.db.query(LearnedMapping).all()
        for mapping in mappings:
            result = self._apply_mapping_to_command(mapping, command)
            if result is not None:
                return result
        return None

    def resolve_unknown_command(self, command: str) -> dict[str, Any] | None:
        return self.apply_pattern(command)

    def resolve_unknown_commands_for_mapping(self, mapping: LearnedMapping) -> int:
        if hasattr(mapping, 'enabled') and mapping.enabled is False:
            return 0

        records = (
            self.db.query(UnknownCommand)
            .filter(UnknownCommand.resolved.is_(False))
            .all()
        )
        resolved_at = datetime.utcnow()
        resolved_count = 0
        for record in records:
            if self._apply_mapping_to_command(mapping, record.command) is None:
                continue

            record.resolved = True
            record.resolved_by_mapping_id = mapping.id
            record.resolved_at = resolved_at
            resolved_count += 1

        if resolved_count:
            self.db.commit()
        return resolved_count

    def merge_with_priority(self, deterministic: dict[str, Any], learned: dict[str, Any], ai: dict[str, Any]) -> dict[str, Any]:
        merged = {
            'device': dict(deterministic.get('device', {}) or {}),
            'security': dict(deterministic.get('security', {}) or {}),
            'network': dict(deterministic.get('network', {}) or {}),
        }

        for section_name in ('device', 'security', 'network'):
            for key, value in (learned.get(section_name, {}) or {}).items():
                current = merged[section_name].get(key)
                if current in (None, '', [], {}):
                    merged[section_name][key] = value

            for key, value in (ai.get(section_name, {}) or {}).items():
                current = merged[section_name].get(key)
                if current in (None, '', [], {}) and key not in learned.get(section_name, {}):
                    merged[section_name][key] = value

        return merged

    def ai_suggestion_is_approved(self, suggestion: dict[str, Any], approved: bool) -> bool:
        if not approved:
            return False
        return bool(suggestion.get('parameter'))
