from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.db.models import User
from app.db.audit_repository import AuditRepository
from app.services.training.learning_engine import LearningEngine

router = APIRouter(prefix="/api/training", tags=["training"])


class MappingPayload(BaseModel):
    vendor: str = "unknown"
    command_pattern: str
    normalized_parameter: str
    value_type: str = "string"
    description: str | None = None
    confidence: float = 1.0
    enabled: bool = True


@router.get("/unknown")
async def list_unknown_commands(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repository = AuditRepository(db, user_id=current_user.id)
    return repository.list_unknown_commands()


@router.get("/mappings")
async def list_learned_mappings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engine = LearningEngine(db, user_id=current_user.id)
    return engine.list_mappings()


@router.post("/mapping")
async def create_mapping(payload: MappingPayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        engine = LearningEngine(db, user_id=current_user.id)
        mapping = engine.create_mapping(
            vendor=payload.vendor,
            command_pattern=payload.command_pattern,
            normalized_parameter=payload.normalized_parameter,
            value_type=payload.value_type,
            description=payload.description,
            confidence=payload.confidence,
            enabled=payload.enabled,
        )
        return mapping
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/mapping/{mapping_id}")
async def delete_mapping(mapping_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    engine = LearningEngine(db, user_id=current_user.id)
    try:
        engine.disable_mapping(mapping_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return {"status": "disabled", "mapping_id": mapping_id}
