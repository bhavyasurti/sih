import os
import json
import logging
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Structured Output Schemas
class AINormalizedCommand(BaseModel):
    normalized_action: str
    confidence: float
    requires_admin_validation: bool = True

class AIAnalysisResult(BaseModel):
    vendor: str
    raw_command: str
    normalized_parameter: Optional[str] = None
    extracted_value: Optional[str] = None
    related_control: Optional[str] = None
    meaning: Optional[str] = None
    suggested_mapping: Optional[str] = None
    confidence: float
    requires_admin_validation: bool = True

class AIFindingReview(BaseModel):
    what_happened: str
    why_is_this_a_problem: str
    what_should_we_do: str
    proposed_solution: str
    why_this_solution: str
    verification_steps: str
    confidence: float
    source: str = "AI-generated review"
    requires_admin_validation: bool = True
class BatchedAIFindingReview(AIFindingReview):
    control_id: str

class AIFindingReviewBatchResponse(BaseModel):
    reviews: list[BatchedAIFindingReview]


class GeminiService:
    def __init__(self, api_key: Optional[str] = None):
        settings = get_settings()
        self.api_key = api_key or settings.gemini_api_key or os.getenv('GEMINI_API_KEY')
        self.model_name = os.getenv('GEMINI_MODEL', 'gemini-3.6-flash')
        self.client = None
        self.init_error = None
        if self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                self.init_error = str(e)
                logger.error(f"Failed to initialize Gemini Client: {e}")
        else:
            self.init_error = "API key is missing"

    def is_available(self) -> bool:
        return self.client is not None

    def analyze_unknown_command(self, vendor: str, command: str, context: str = '') -> Dict[str, Any]:
        if not self.is_available():
            return {"recognized": False, "confidence": 0.0, "requires_admin_validation": True, "error": f"Gemini AI unavailable: {self.init_error}"}

        from app.services.training.learning_engine import SUPPORTED_PARAMETERS
        valid_vendors = ['cisco', 'fortinet', 'paloalto', 'juniper', 'aruba', 'checkpoint', 'unknown']

        prompt = f"""
        Analyze this unknown network command.
        Vendor: {vendor}
        Command: {command}
        Context: {context}

        IMPORTANT:
        If you recognize a security-related parameter, 'normalized_parameter' MUST be one of the following exactly: {', '.join(SUPPORTED_PARAMETERS)}.
        If none apply, omit 'normalized_parameter' or set to null.
        The 'vendor' MUST be one of the following: {', '.join(valid_vendors)}. If unsure, use 'unknown'.
        Extract any corresponding setting to the 'extracted_value' field.
        """
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AIAnalysisResult,
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
            
            # Backend validation against registries
            param = data.get('normalized_parameter')
            if param and param not in SUPPORTED_PARAMETERS:
                data['normalized_parameter'] = None
                data['requires_admin_validation'] = True
                
            returned_vendor = data.get('vendor')
            if returned_vendor and returned_vendor.lower() not in valid_vendors:
                data['vendor'] = 'unknown'
                data['requires_admin_validation'] = True

            # Ensure safe fallback for low confidence
            if data.get('confidence', 0.0) < 0.7:
                data['requires_admin_validation'] = True
            
            if data.get('normalized_parameter') is None:
                 data['requires_admin_validation'] = True
                 
            return data
        except Exception as e:
            logger.error(f"Gemini AI analyze_unknown_command failed: {e}")
            return {"recognized": False, "confidence": 0.0, "requires_admin_validation": True, "error": str(e)}

    def review_finding(self, finding: Dict[str, Any], config_context: str) -> Dict[str, Any]:
        if not self.is_available():
            return {"error": f"Gemini AI unavailable: {self.init_error}"}

        prompt = f"""
        You are a cybersecurity AI Copilot. A compliance issue was found in a network device configuration.
        Provide a complete, structured review and fix. 
        Vendor: {finding.get('vendor')}
        Framework: {finding.get('framework', 'CIS')}
        Control Title: {finding.get('title')}
        Control ID: {finding.get('control_id')}
        Expected State: {finding.get('expected')}
        Observed State: {finding.get('actual')}
        Finding Detail: {finding.get('finding') or finding.get('description')}
        Existing Remediation: {finding.get('remediation', 'None')}
        Configuration Context: {config_context}
        
        The response MUST include the proposed solution commands for this specific vendor, a clear explanation of what happened, why it is a problem, what we should do, why this solution works, and how to verify it.
        If 'Existing Remediation' is valid, use it for 'proposed_solution'.
        """
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AIFindingReview,
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
            data['requires_admin_validation'] = True
            data['source'] = "AI-generated review"
            return data
        except Exception as e:
            logger.error(f"Gemini AI review_finding failed: {e}")
            return {"error": str(e)}

    def review_findings_batch(self, findings: list[Dict[str, Any]], config_context: str) -> Dict[str, Any]:
        if not self.is_available():
            return {"error": "Gemini AI unavailable"}
            
        if not findings:
            return {"reviews": []}

        prompt = f"You are a cybersecurity AI Copilot. A compliance audit was run on a network device configuration.\n"
        prompt += f"Configuration Context:\n{config_context}\n\n"
        prompt += "Below are the compliance issues found. Provide a complete, structured review and fix for each finding.\n\n"
        
        for i, finding in enumerate(findings):
            prompt += f"--- Finding {i+1} ---\n"
            prompt += f"Vendor: {finding.get('vendor')}\n"
            prompt += f"Framework: {finding.get('framework', 'CIS')}\n"
            prompt += f"Control Title: {finding.get('title')}\n"
            prompt += f"Control ID: {finding.get('control_id')}\n"
            prompt += f"Expected State: {finding.get('expected')}\n"
            prompt += f"Observed State: {finding.get('actual')}\n"
            prompt += f"Finding Detail: {finding.get('finding') or finding.get('description')}\n"
            prompt += f"Existing Remediation: {finding.get('remediation', 'None')}\n\n"
            
        prompt += """
        The response MUST include a list of reviews matching the provided findings.
        For each review, you MUST include the 'control_id' to map it back to the finding.
        Include proposed solution commands for the specific vendor, a clear explanation of what happened, why it is a problem, what we should do, why this solution works, and how to verify it.
        If 'Existing Remediation' is valid, use it for 'proposed_solution'.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AIFindingReviewBatchResponse,
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
            
            # Enrich data
            for review in data.get('reviews', []):
                review['requires_admin_validation'] = True
                review['source'] = "AI-generated review"
                
            return data
        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "quota" in error_str or "exhausted" in error_str:
                logger.error(f"Gemini API rate limit exceeded: {e}")
                return {"error": "rate_limit_exceeded"}
            
            logger.error(f"Gemini AI review_findings_batch failed: {e}")
            return {"error": str(e)}


    def normalize_command(self, command: str, vendor: str) -> Dict[str, Any]:
        if not self.is_available():
            return {"normalized_action": "unknown", "confidence": 0.0, "requires_admin_validation": True, "error": "Gemini AI unavailable"}

        prompt = f"""
        Translate this vendor-specific command into a normalized security intent.
        Vendor: {vendor}
        Command: {command}
        """
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AINormalizedCommand,
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
            if data.get('confidence', 0.0) < 0.7:
                data['requires_admin_validation'] = True
            return data
        except Exception as e:
            logger.error(f"Gemini AI normalize_command failed: {e}")
            return {"normalized_action": "unknown", "confidence": 0.0, "requires_admin_validation": True, "error": str(e)}
