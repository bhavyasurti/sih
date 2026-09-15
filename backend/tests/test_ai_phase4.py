import json
from unittest.mock import MagicMock, patch

import pytest
from pydantic import ValidationError

from app.services.gemini_service import GeminiService

def test_missing_api_key_falls_back():
    with patch.dict('os.environ', {}, clear=True), patch('app.services.gemini_service.get_settings') as mock_settings:
        mock_settings.return_value.gemini_api_key = None
        service = GeminiService()
        result = service.analyze_unknown_command('cisco', 'unknown cmd')
        assert result['recognized'] is False
        assert result['requires_admin_validation'] is True
        assert 'error' in result

def test_gemini_is_available():
    with patch.dict('os.environ', {'GEMINI_API_KEY': 'dummy_key'}), patch('app.services.gemini_service.get_settings') as mock_settings:
        mock_settings.return_value.gemini_api_key = None
        service = GeminiService()
        assert service.is_available() is True

def test_review_findings_batch_fallback():
    with patch.dict('os.environ', {}, clear=True), patch('app.services.gemini_service.get_settings') as mock_settings:
        mock_settings.return_value.gemini_api_key = None
        service = GeminiService()
        result = service.review_findings_batch([{'control_id': 'CIS-1.1'}], "config context")
        assert result['error'] == 'Gemini AI unavailable'

def test_normalize_command_fallback():
    with patch.dict('os.environ', {}, clear=True), patch('app.services.gemini_service.get_settings') as mock_settings:
        mock_settings.return_value.gemini_api_key = None
        service = GeminiService()
        result = service.normalize_command('ip ssh version 1', 'cisco')
        assert result['normalized_action'] == 'unknown'

def test_analyze_unknown_command_mock_response():
    with patch.dict('os.environ', {'GEMINI_API_KEY': 'dummy'}):
        service = GeminiService()
        service.client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "vendor": "cisco",
            "command": "test cmd",
            "recognized": True,
            "confidence": 0.8,
            "requires_admin_validation": True
        })
        service.client.models.generate_content.return_value = mock_response
        
        result = service.analyze_unknown_command('cisco', 'test cmd')
        assert result['recognized'] is True
        assert result['confidence'] == 0.8
        assert result['requires_admin_validation'] is True

def test_analyze_unknown_command_low_confidence():
    with patch.dict('os.environ', {'GEMINI_API_KEY': 'dummy'}):
        service = GeminiService()
        service.client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "vendor": "cisco",
            "command": "bad cmd",
            "recognized": True,
            "confidence": 0.3,
            "requires_admin_validation": False
        })
        service.client.models.generate_content.return_value = mock_response
        
        result = service.analyze_unknown_command('cisco', 'bad cmd')
        # Confidence < 0.7 should set requires_admin_validation = True
        assert result['recognized'] is True
        assert result['requires_admin_validation'] is True
