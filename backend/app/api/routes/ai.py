from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.gemini_service import GeminiService
from app.api.deps import get_current_user, get_db
from app.db.models import User, ApprovalHistory
from sqlalchemy.orm import Session
from typing import Any, List
router = APIRouter(prefix='/api/ai', tags=['ai'])

class AIAnalyzeCommandRequest(BaseModel):
    vendor: str = 'unknown'
    command: str
    context: str = ''

class AIReviewFindingRequest(BaseModel):
    finding: dict
    config_context: str = ''

@router.post('/analyze-command')
async def analyze_command(payload: AIAnalyzeCommandRequest, current_user: User = Depends(get_current_user)):
    service = GeminiService()
    result = service.analyze_unknown_command(payload.vendor, payload.command, payload.context)
    return result

@router.post('/review-finding')
async def review_finding(payload: AIReviewFindingRequest, current_user: User = Depends(get_current_user)):
    service = GeminiService()
    result = service.review_finding(payload.finding, payload.config_context)
    return result

class AIReviewFindingsBatchRequest(BaseModel):
    findings: List[dict]
    config_context: str = ''

@router.post('/review-findings-batch')
async def review_findings_batch(
    payload: AIReviewFindingsBatchRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service = GeminiService()
    
    # 1. Identify which findings can be satisfied from cache (ApprovalHistory)
    cached_results = {}
    uncached_findings = []
    
    for finding in payload.findings:
        control_id = finding.get('control_id')
        vendor = finding.get('vendor')
        actual_state = finding.get('actual')
        
        expected_state = finding.get('expected', '')
        deterministic_remediation = finding.get('remediation', '')
        
        # Check cache
        history_entry = db.query(ApprovalHistory).filter(
            ApprovalHistory.finding == control_id,
            ApprovalHistory.vendor == vendor,
            ApprovalHistory.original_state == actual_state,
            ApprovalHistory.expected_state == expected_state,
            ApprovalHistory.deterministic_remediation == deterministic_remediation,
            ApprovalHistory.approval_status == 'approved'
        ).order_by(ApprovalHistory.created_at.desc()).first()
        
        if history_entry:
            # We have a cached valid remediation
            cached_results[control_id] = {
                "what_happened": "Previously audited",
                "why_is_this_a_problem": "Previously identified issue",
                "what_should_we_do": "Apply the approved fix",
                "proposed_solution": history_entry.proposed_solution,
                "why_this_solution": "Cached from previous approval",
                "verification_steps": history_entry.verification_steps or "Re-run audit after apply",
                "confidence": 1.0,
                "source": "Cached Approval",
                "requires_admin_validation": False,
                "control_id": control_id
            }
        else:
            uncached_findings.append(finding)
            
    # 2. Call Gemini only for uncached findings
    if uncached_findings:
        gemini_result = service.review_findings_batch(uncached_findings, payload.config_context)
        
        # Check if rate limited
        if gemini_result.get("error"):
            return {"error": gemini_result.get("error"), "cached_results": cached_results}
            
        # Merge gemini_result back into our final result
        reviews = gemini_result.get("reviews", [])
        for review in reviews:
            c_id = review.get("control_id")
            if c_id:
                cached_results[c_id] = review
                
    return {"reviews": cached_results}

