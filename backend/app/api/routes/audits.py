from __future__ import annotations

from pathlib import Path
import re

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.db.audit_repository import AuditRepository
from app.services.gemini_service import GeminiService
from app.services.compliance.engine import evaluate
from app.services.remediation.engine import enrich_compliance_result, enrich_findings_with_remediation
from app.services.reporting.report_generator import generate_compliance_pdf
from app.services.training.learning_engine import LearningEngine
from app.services.parsers.fortios_parser import parse_fortios_config
from app.services.parsers.ios_parser import parse_ios_config
from app.services.parsers.normalizer import normalize_security_data
from app.services.parsers.panos_parser import parse_panos_config
from app.services.parsers.juniper_parser import parse_juniper_config
from app.services.parsers.aruba_parser import parse_aruba_config
from app.services.parsers.checkpoint_parser import parse_checkpoint_config
from app.services.parsers.vendor_detector import detect_vendor

from app.api.deps import get_current_user
from app.core.config import get_data_dir
from app.db.models import User

router = APIRouter(prefix="/api/audits", tags=["audits"])

UPLOAD_DIR = None


def _get_upload_dir() -> Path:
    if UPLOAD_DIR is not None:
        upload_dir = Path(UPLOAD_DIR)
    else:
        upload_dir = get_data_dir() / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def _get_reports_dir() -> Path:
    reports_dir = get_data_dir() / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    return reports_dir

def secure_filename(filename: str) -> str:
    name = Path(filename).name
    # Keep only alphanumeric, dot, dash, and underscore
    return re.sub(r'[^a-zA-Z0-9_.-]', '_', name)



class ComplianceRequest(BaseModel):
    framework: str = "CIS"


class AnalysisOptions(BaseModel):
    ai_enabled: bool = True
    framework: str = "CIS"

class ApplyRemediationRequest(BaseModel):
    finding: str
    proposed_solution: str
    user_edited: bool = False
    control_title: str = ""
    expected_state: str = ""
    deterministic_remediation: str = ""
    verification_steps: str = ""


MAX_FILE_SIZE = 2 * 1024 * 1024


@router.post("/upload")
async def upload_audit_file(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if file.filename is None:
        raise HTTPException(status_code=400, detail="Filename is required")

    allowed_exts = {".txt", ".cfg", ".conf", ".config", ".log"}
    if Path(file.filename).suffix.lower() not in allowed_exts:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds maximum size of 2MB")

    safe_name = secure_filename(file.filename)
    repository = AuditRepository(db, user_id=current_user.id)
    audit = repository.create_audit_record(title=safe_name)

    safe_path = _get_upload_dir() / f"{audit.id}_{safe_name}"
    with open(safe_path, "wb") as fh:
        fh.write(content)


    return {
        "audit_id": audit.id,
        "filename": safe_name,
        "size": len(content),
        "status": "uploaded",
        "storage_path": str(safe_path),
    }


@router.get("")
async def list_audits(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repository = AuditRepository(db, user_id=current_user.id)
    audits = repository.list_audits()
    return [
        {"id": audit.id, "title": audit.title, "status": audit.status, "framework": audit.framework, "compliance_score": audit.compliance_score}
        for audit in audits
    ]


@router.get("/{audit_id}")
async def get_audit(audit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repository = AuditRepository(db, user_id=current_user.id)
    audit = repository.get_audit(audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")
    return {
        "id": audit.id,
        "title": audit.title,
        "status": audit.status,
        "framework": audit.framework,
        "compliance_score": audit.compliance_score,
        "summary": audit.summary,
    }


@router.post("/{audit_id}/analyze")
async def analyze_audit(audit_id: int, options: AnalysisOptions | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repository = AuditRepository(db, user_id=current_user.id)
    audit = repository.get_audit(audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")

    upload_dir = _get_upload_dir()
    candidate_files = [
        upload_dir / audit.title,
        upload_dir / f"{audit.id}_{audit.title}",
    ]
    audit_file = next((path for path in candidate_files if path.exists()), None)
    if audit_file is None:
        raise HTTPException(status_code=404, detail="Uploaded configuration file not found")

    with open(audit_file, "r", encoding="utf-8", errors="ignore") as fh:
        config_text = fh.read()

    detection = detect_vendor(config_text)
    vendor = detection["vendor"]
    parser_map = {
        "cisco": parse_ios_config,
        "fortinet": parse_fortios_config,
        "paloalto": parse_panos_config,
        "juniper": parse_juniper_config,
        "aruba": parse_aruba_config,
        "checkpoint": parse_checkpoint_config,
    }

    parser = parser_map.get(vendor)
    if parser is None:
        raise HTTPException(status_code=400, detail="Unsupported vendor configuration")

    parsed = parser(config_text)
    deterministic = normalize_security_data(parsed)

    learning_engine = LearningEngine(db)
    resolved_unknown_commands: list[dict] = []
    for command_item in parsed.get("unknown_commands", []):
        command = command_item.get("command") if isinstance(command_item, dict) else command_item
        if not command:
            continue

        command_text = str(command)
        learned_match = learning_engine.resolve_unknown_command(command_text)
        if learned_match and learned_match.get("parameter"):
            security_section = deterministic.setdefault("security", {})
            current_value = security_section.get(learned_match["parameter"])
            if current_value in (None, "", [], {}):
                security_section[learned_match["parameter"]] = learned_match["value"]
                continue

        resolved_unknown_commands.append(command_item)

    unknown_commands = resolved_unknown_commands

    merged = deterministic
    ai_status = 'unavailable'
    fallback_used = False

    device_payload = {
        "name": merged["device"].get("hostname") or audit.title,
        "vendor": vendor,
        "model": merged["device"].get("model"),
        "hostname": merged["device"].get("hostname"),
        "status": "active",
    }

    device = repository.create_device(device_payload)
    audit.status = "analyzed"
    audit.summary = f"Vendor detected: {vendor}"
    audit.framework = "CIS"
    db.commit()

    repository.save_unknown_commands(audit_id, device.id, unknown_commands)

    return {
        "audit_id": audit_id,
        "vendor": vendor,
        "vendor_confidence": detection["confidence"],
        "device": merged["device"],
        "security": merged["security"],
        "network": merged["network"],
        "unknown_commands": unknown_commands,
        "ai": {
            "enabled": bool(options.ai_enabled if options else True),
            "provider": "gemini",
            "status": ai_status,
            "fallback_used": fallback_used,
        },
    }


@router.post("/{audit_id}/compliance")
async def evaluate_compliance(audit_id: int, request: ComplianceRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repository = AuditRepository(db, user_id=current_user.id)
    audit = repository.get_audit(audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")

    upload_dir = _get_upload_dir()
    candidate_files = [
        upload_dir / audit.title,
        upload_dir / f"{audit.id}_{audit.title}",
    ]
    audit_file = next((path for path in candidate_files if path.exists()), None)
    if audit_file is None:
        raise HTTPException(status_code=404, detail="Uploaded configuration file not found")

    with open(audit_file, "r", encoding="utf-8", errors="ignore") as fh:
        config_text = fh.read()

    detection = detect_vendor(config_text)
    vendor = detection["vendor"]
    parser_map = {
        "cisco": parse_ios_config,
        "fortinet": parse_fortios_config,
        "paloalto": parse_panos_config,
        "juniper": parse_juniper_config,
        "aruba": parse_aruba_config,
        "checkpoint": parse_checkpoint_config,
    }
    parser = parser_map.get(vendor)
    if parser is None:
        raise HTTPException(status_code=400, detail="Unsupported vendor configuration")

    parsed = parser(config_text)
    normalized = normalize_security_data(parsed)
    framework = request.framework.upper()
    if framework not in {"CIS", "NIST"}:
        raise HTTPException(status_code=400, detail="Framework must be CIS or NIST")

    result = evaluate(normalized, framework)
    enriched_result = enrich_compliance_result(result, vendor)
    findings = enriched_result.get("findings", [])
    if findings:
        repository.save_findings(audit_id, findings)

    audit.framework = framework
    audit.compliance_score = float(enriched_result.get("score", 0))
    audit.status = "compliant"
    audit.summary = f"{framework} MVP control set evaluated. Score: {enriched_result.get('score')}"
    db.commit()

    response = {
        "audit_id": audit_id,
        "vendor": vendor,
        "framework": framework,
        "score": enriched_result.get("score", 0),
        "overall_risk": enriched_result.get("overall_risk", "Low"),
        "total_controls": enriched_result.get("total_controls", len(findings)),
        "summary": {
            "passed": enriched_result.get("passed"),
            "failed": enriched_result.get("failed"),
            "unknown": enriched_result.get("unknown"),
            "critical": enriched_result.get("critical"),
            "high": enriched_result.get("high"),
            "medium": enriched_result.get("medium"),
            "low": enriched_result.get("low"),
        },
        "findings": findings,
    }
    return response


@router.post("/{audit_id}/apply-remediation")
async def apply_remediation(audit_id: int, request: ApplyRemediationRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.db.models import ApprovalHistory
    repository = AuditRepository(db, user_id=current_user.id)
    audit = repository.get_audit(audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")

    upload_dir = _get_upload_dir()
    candidate_files = [
        upload_dir / audit.title,
        upload_dir / f"{audit.id}_{audit.title}",
    ]
    audit_file = next((path for path in candidate_files if path.exists()), None)
    if audit_file is None:
        raise HTTPException(status_code=404, detail="Uploaded configuration file not found")

    with open(audit_file, "r", encoding="utf-8", errors="ignore") as fh:
        config_text = fh.read()
    
    detection = detect_vendor(config_text)
    vendor = detection["vendor"]
    
    # Append the remediation to the configuration file
    new_config = config_text + "\n\n! Applied Remediation for " + request.finding + "\n" + request.proposed_solution + "\n"
    
    with open(audit_file, "w", encoding="utf-8") as fh:
        fh.write(new_config)

    # Re-audit
    parser_map = {
        "cisco": parse_ios_config,
        "fortinet": parse_fortios_config,
        "paloalto": parse_panos_config,
        "juniper": parse_juniper_config,
        "aruba": parse_aruba_config,
        "checkpoint": parse_checkpoint_config,
    }
    parser = parser_map.get(vendor)
    if not parser:
        raise HTTPException(status_code=400, detail="Unsupported vendor configuration")

    parsed = parser(new_config)
    normalized = normalize_security_data(parsed)
    framework = audit.framework or "CIS"
    
    result = evaluate(normalized, framework)
    enriched_result = enrich_compliance_result(result, vendor)
    findings = enriched_result.get("findings", [])
    if findings:
        repository.save_findings(audit_id, findings)

    audit.compliance_score = float(enriched_result.get("score", 0))
    audit.summary = f"{framework} MVP control set evaluated. Score: {enriched_result.get('score')}"
    
    # Check if the problem was resolved (status == PASS)
    new_finding_status = "UNKNOWN"
    for f in findings:
        if f.get("control_id") == request.finding or f.get("title") == request.control_title:
            new_finding_status = f.get("status", "UNKNOWN")
    
    history_entry = ApprovalHistory(
        user_id=current_user.id,
        audit_id=audit_id,
        finding=request.finding,
        framework=framework,
        vendor=vendor,
        original_state="FAIL",
        expected_state=request.expected_state,
        deterministic_remediation=request.deterministic_remediation,
        proposed_solution=request.proposed_solution,
        verification_steps=request.verification_steps,
        user_edited=request.user_edited,
        approval_status="approved",
        resulting_audit_status=new_finding_status
    )
    db.add(history_entry)
    db.commit()

    return {
        "audit_id": audit_id,
        "status": "success",
        "new_score": enriched_result.get("score", 0),
        "resulting_audit_status": new_finding_status,
        "message": f"Remediation applied. Control is now {new_finding_status}.",
        "findings": findings
    }



@router.get("/{audit_id}/report")
@router.get("/{audit_id}/report/pdf")
async def get_audit_report(audit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repository = AuditRepository(db, user_id=current_user.id)
    audit = repository.get_audit(audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="Audit not found")

    upload_dir = _get_upload_dir()
    candidate_files = [
        upload_dir / audit.title,
        upload_dir / f"{audit.id}_{audit.title}",
    ]
    audit_file = next((path for path in candidate_files if path.exists()), None)

    device = repository.get_device(audit.device_id) if audit.device_id else None
    vendor = getattr(device, "vendor", None) or "unknown"
    hostname = getattr(device, "hostname", None) or audit.title
    model = getattr(device, "model", None) or "N/A"
    os_version = getattr(device, "os_version", None) or "N/A"

    db_findings = repository.get_findings_for_audit(audit_id)
    if db_findings:
        findings = [
            {
                "control_id": f.control_id,
                "control": f.control_id,
                "title": f.title,
                "severity": f.severity,
                "status": f.status,
                "finding": f.description or f.evidence or f.title,
                "current_state": f.actual or "Not observed",
                "expected": f.expected,
                "actual": f.actual,
                "evidence": f.evidence,
                "remediation": f.remediation or "Manual remediation required",
                "vendor": vendor,
            }
            for f in db_findings
        ]
        score = audit.compliance_score or 0.0
        framework = audit.framework or "CIS"
    elif audit_file and audit_file.exists():
        with open(audit_file, "r", encoding="utf-8", errors="ignore") as fh:
            config_text = fh.read()
        detection = detect_vendor(config_text)
        vendor = detection["vendor"]
        parser_map = {
            "cisco": parse_ios_config,
            "fortinet": parse_fortios_config,
            "paloalto": parse_panos_config,
            "juniper": parse_juniper_config,
            "aruba": parse_aruba_config,
            "checkpoint": parse_checkpoint_config,
        }
        parser = parser_map.get(vendor)
        if parser:
            parsed = parser(config_text)
            normalized = normalize_security_data(parsed)
            framework = (audit.framework or "CIS").upper()
            result = evaluate(normalized, framework)
            enriched_result = enrich_compliance_result(result, vendor)
            findings = enriched_result.get("findings", [])
            score = float(enriched_result.get("score", 0))
            if findings:
                repository.save_findings(audit_id, findings)
            audit.compliance_score = score
            db.commit()
        else:
            findings = []
            score = 0.0
            framework = audit.framework or "CIS"
    else:
        findings = []
        score = audit.compliance_score or 0.0
        framework = audit.framework or "CIS"

    audit_data = {
        "id": audit.id,
        "title": audit.title,
        "status": audit.status,
        "framework": framework,
        "compliance_score": score,
        "created_at": audit.created_at,
        "device": {
            "hostname": hostname,
            "vendor": vendor,
            "model": model,
            "os_version": os_version,
        },
    }

    compliance_data = {
        "score": score,
        "framework": framework,
        "vendor": vendor,
        "summary": {
            "passed": sum(1 for f in findings if f.get("status") == "PASS"),
            "failed": sum(1 for f in findings if f.get("status") == "FAIL"),
            "unknown": sum(1 for f in findings if f.get("status") == "UNKNOWN"),
        },
    }

    pdf_bytes = generate_compliance_pdf(audit_data, compliance_data, findings)

    reports_dir = _get_reports_dir()
    report_filename = f"compliance_report_audit_{audit_id}.pdf"
    report_path = reports_dir / report_filename
    with open(report_path, "wb") as fh:
        fh.write(pdf_bytes)

    repository.create_report(
        audit_id=audit_id,
        title=f"Compliance Report - {audit.title}",
        file_name=report_filename,
        summary=f"Score: {score}%, Framework: {framework}",
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=compliance_report_audit_{audit_id}.pdf",
        },
    )


@router.get("/reports/list")
async def list_generated_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    repository = AuditRepository(db, user_id=current_user.id)
    reports = repository.list_reports()
    return [
        {
            "id": r.id,
            "audit_id": r.audit_id,
            "title": r.title,
            "file_name": r.file_name,
            "generated_at": r.generated_at,
            "status": r.status,
            "summary": r.summary,
        }
        for r in reports
    ]


@router.get("/approvals/history")
async def list_approval_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.db.models import ApprovalHistory
    history = db.query(ApprovalHistory).filter(ApprovalHistory.user_id == current_user.id).order_by(ApprovalHistory.created_at.desc()).limit(50).all()
    return [
        {
            "id": h.id,
            "audit_id": h.audit_id,
            "finding": h.finding,
            "framework": h.framework,
            "vendor": h.vendor,
            "original_state": h.original_state,
            "proposed_solution": h.proposed_solution,
            "user_edited": h.user_edited,
            "approval_status": h.approval_status,
            "resulting_audit_status": h.resulting_audit_status,
            "created_at": h.created_at
        }
        for h in history
    ]

