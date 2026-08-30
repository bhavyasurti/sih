from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ai.ai_service import AIService

router = APIRouter(prefix='/api/ai', tags=['ai'])


class AIInterpretCommandRequest(BaseModel):
    vendor: str = 'unknown'
    command: str
    context: str = ''


class AIInterpretCommandResponse(BaseModel):
    parameter: str | None
    value: object | None
    confidence: float
    reasoning_summary: str
    requires_review: bool = False


@router.post('/interpret-command')
async def interpret_command(payload: AIInterpretCommandRequest):
    service = AIService(enabled=True)
    result = service.interpret_unknown_command(payload.vendor, payload.command, payload.context)
    response = AIInterpretCommandResponse(**result)
    return response.model_dump()
