from __future__ import annotations

import json
import os
import re
from typing import Any

from pydantic import ValidationError

from app.services.ai.ai_interface import AIProvider
from app.services.ai.google_ai_adapter import GoogleAIAdapter
from app.services.ai.schemas import AIInterpretationSchema, NormalizedAuditSchema


class AIService:
    def __init__(self, enabled: bool = True, provider: AIProvider | None = None):
        self.enabled = enabled
        self._provider = provider or self._build_provider()

    def _build_provider(self) -> AIProvider | None:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return None
        try:
            return GoogleAIAdapter(api_key=api_key)
        except Exception:
            return None

    def redact_sensitive_text(self, text: str) -> str:
        patterns = [
            r'password\s*[:=]?\s*[^\s,;]+',
            r'secret\s*[:=]?\s*[^\s,;]+',
            r'community\s*[:=]?\s*[^\s,;]+',
            r'token\s*[:=]?\s*[^\s,;]+',
            r'api-key\s*[:=]?\s*[^\s,;]+',
            r'private-key\s*[:=]?\s*[^\s,;]+',
        ]
        redacted = text
        for pattern in patterns:
            redacted = re.sub(pattern, '[REDACTED]', redacted, flags=re.IGNORECASE)
        return redacted

    def normalize_configuration(self, config_text: str, vendor: str, deterministic: dict[str, Any]) -> dict[str, Any]:
        if not self.enabled or self._provider is None:
            return {
                'status': 'unavailable',
                'fallback_used': True,
                'normalized': deterministic,
                'provider': 'gemini',
                'used': False,
                'ai_insights': {'commands_interpreted': 0, 'values_inferred': 0, 'low_confidence': 0},
            }

        try:
            sanitized_text = self.redact_sensitive_text(config_text)
            payload = self._provider.normalize_configuration(sanitized_text, vendor, deterministic)
            validated = NormalizedAuditSchema.model_validate(payload)
            return {
                'status': 'used',
                'fallback_used': False,
                'normalized': validated.model_dump(),
                'provider': 'gemini',
                'used': True,
                'ai_insights': {'commands_interpreted': 0, 'values_inferred': 0, 'low_confidence': 0},
            }
        except (TypeError, ValueError, ValidationError, json.JSONDecodeError, RuntimeError, Exception):
            return {
                'status': 'fallback',
                'fallback_used': True,
                'normalized': deterministic,
                'provider': 'gemini',
                'used': False,
                'ai_insights': {'commands_interpreted': 0, 'values_inferred': 0, 'low_confidence': 0},
            }

    def interpret_unknown_command(self, vendor: str, command: str, context: str = '') -> dict[str, Any]:
        if self._provider is None:
            return {
                'parameter': None,
                'value': None,
                'confidence': 0.0,
                'reasoning_summary': 'AI unavailable — deterministic parser used',
                'requires_review': True,
            }

        try:
            payload = self._provider.interpret_unknown_command(vendor, self.redact_sensitive_text(command), context)
            validated = AIInterpretationSchema.model_validate(payload)
            result = validated.model_dump()
            result['requires_review'] = result.get('confidence', 0.0) < 0.70
            return result
        except (TypeError, ValueError, ValidationError, json.JSONDecodeError, RuntimeError, Exception):
            return {
                'parameter': None,
                'value': None,
                'confidence': 0.0,
                'reasoning_summary': 'AI interpretation unavailable — deterministic parser used',
                'requires_review': True,
            }

    def _normalize_ai_confidence(self, confidence: float) -> dict[str, Any]:
        return {
            'confidence': max(0.0, min(1.0, float(confidence))),
            'requires_review': confidence < 0.70,
        }

    def merge_normalized_models(self, deterministic: dict[str, Any], ai_payload: dict[str, Any]) -> dict[str, Any]:
        base = {
            'device': dict(deterministic.get('device', {}) or {}),
            'security': dict(deterministic.get('security', {}) or {}),
            'network': dict(deterministic.get('network', {}) or {}),
            'unknown_commands': list(deterministic.get('unknown_commands', []) or []),
        }

        for section_name in ('device', 'security', 'network'):
            deterministic_section = deterministic.get(section_name, {}) or {}
            ai_section = ai_payload.get(section_name, {}) or {}
            for key, value in ai_section.items():
                current = deterministic_section.get(key)
                if current in (None, '', [], {}):
                    base[section_name][key] = value
                elif key not in base[section_name]:
                    base[section_name][key] = value
                else:
                    base[section_name][key] = current

        if isinstance(base.get('network'), dict) and isinstance(deterministic.get('network'), dict):
            for key, value in deterministic.get('network', {}).items():
                base['network'].setdefault(key, value)

        return base
