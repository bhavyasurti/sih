from __future__ import annotations

import json
import os
from typing import Any

from google import genai

from app.services.ai.ai_interface import AIProvider
from app.services.ai.prompts import SYSTEM_PROMPT
from app.services.ai.schemas import AIInterpretationSchema, NormalizedAuditSchema


class GoogleAIAdapter(AIProvider):
    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        self.client = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception:
                self.client = None

    def normalize_configuration(self, config_text: str, vendor: str, deterministic: dict[str, Any]) -> dict[str, Any]:
        if not self.client:
            raise RuntimeError('Gemini unavailable: no API key or client initialization failed')

        prompt = f"Vendor: {vendor}\n\nNormalized schema target:\n{json.dumps(deterministic, indent=2)}\n\nConfiguration:\n{config_text}\n\nReturn only valid JSON matching the requested schema."
        response = self.client.models.generate_content(
            model='gemini-2.0-flash',
            contents=[SYSTEM_PROMPT, prompt],
        )
        text = getattr(response, 'text', None) or str(response)
        payload = json.loads(text)
        validated = NormalizedAuditSchema.model_validate(payload)
        return validated.model_dump()

    def interpret_unknown_command(self, vendor: str, command: str, context: str = '') -> dict[str, Any]:
        if not self.client:
            raise RuntimeError('Gemini unavailable: no API key or client initialization failed')

        prompt = (
            "Classify this unknown network command into a normalized security parameter. "
            "Return JSON with keys: parameter, value, confidence, reasoning_summary. "
            "Do not claim certainty when uncertain. "
            f"Vendor: {vendor}\nContext: {context}\nCommand: {command}"
        )
        response = self.client.models.generate_content(
            model='gemini-2.0-flash',
            contents=[SYSTEM_PROMPT, prompt],
        )
        text = getattr(response, 'text', None) or str(response)
        payload = json.loads(text)
        validated = AIInterpretationSchema.model_validate(payload)
        return validated.model_dump()
