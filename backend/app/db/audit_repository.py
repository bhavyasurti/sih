from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.db.models import Audit, Device, Finding, LearnedMapping, Report, UnknownCommand


class AuditRepository:
    def __init__(self, db: Session, user_id: Optional[int] = None):
        self.db = db
        self.user_id = user_id

    def create_audit_record(self, title: str, framework: str = "CIS") -> Audit:
        audit = Audit(title=title, framework=framework, status="uploaded", user_id=self.user_id)
        self.db.add(audit)
        self.db.commit()
        self.db.refresh(audit)
        return audit

    def get_audit(self, audit_id: int) -> Optional[Audit]:
        query = self.db.query(Audit).filter(Audit.id == audit_id)
        if self.user_id is not None:
            query = query.filter(Audit.user_id == self.user_id)
        return query.first()

    def list_audits(self) -> List[Audit]:
        query = self.db.query(Audit)
        if self.user_id is not None:
            query = query.filter(Audit.user_id == self.user_id)
        return query.order_by(Audit.id.desc()).all()

    def create_device(self, device_data: Dict[str, Any]) -> Device:
        device = Device(**device_data)
        self.db.add(device)
        self.db.commit()
        self.db.refresh(device)
        return device

    def update_device(self, device_id: int, device_data: Dict[str, Any]) -> Device:
        device = self.db.query(Device).filter(Device.id == device_id).first()
        if not device:
            raise ValueError(f"Device {device_id} not found")
        for key, value in device_data.items():
            if hasattr(device, key):
                setattr(device, key, value)
        self.db.commit()
        self.db.refresh(device)
        return device

    def create_finding(self, finding_data: Dict[str, Any]) -> Finding:
        finding = Finding(**finding_data)
        self.db.add(finding)
        self.db.commit()
        self.db.refresh(finding)
        return finding

    def save_findings(self, audit_id: int, findings: List[Dict[str, Any]], device_id: Optional[int] = None) -> None:
        for finding in findings:
            self.db.add(
                Finding(
                    audit_id=audit_id,
                    user_id=self.user_id,
                    device_id=device_id,
                    control_id=finding.get("control_id", "UNKNOWN"),
                    framework=finding.get("framework", "CIS"),
                    title=finding.get("title", "Unknown Control"),
                    severity=finding.get("severity", "MEDIUM"),
                    status=finding.get("status", "UNKNOWN"),
                    expected=str(finding.get("expected")) if finding.get("expected") is not None else None,
                    actual=str(finding.get("actual")) if finding.get("actual") is not None else None,
                    description=finding.get("description", ""),
                    evidence=finding.get("evidence"),
                    recommendation=finding.get("remediation"),
                    remediation=finding.get("remediation"),
                )
            )
        self.db.commit()

    def get_findings_for_audit(self, audit_id: int) -> List[Finding]:
        return self.db.query(Finding).filter(Finding.audit_id == audit_id).order_by(Finding.id.asc()).all()

    def get_device(self, device_id: int) -> Optional[Device]:
        return self.db.query(Device).filter(Device.id == device_id).first()

    def save_unknown_commands(self, audit_id: int, device_id: Optional[int], commands: List[Dict[str, Any]]) -> None:
        seen: set[tuple[int, str, str, Optional[int]]] = set()
        for item in commands:
            command = str(item.get("command", "")).strip()
            if not command:
                continue

            vendor = str(item.get("vendor", "unknown"))
            line_number = item.get("line_number")
            dedupe_key = (audit_id, vendor, command, line_number)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)

            existing = (
                self.db.query(UnknownCommand)
                .filter(
                    UnknownCommand.audit_id == audit_id,
                    UnknownCommand.vendor == vendor,
                    UnknownCommand.command == command,
                    UnknownCommand.line_number == line_number,
                )
                .first()
            )
            if existing is not None:
                continue

            ai_suggestion = item.get("ai_suggestion")
            self.db.add(
                UnknownCommand(
                    audit_id=audit_id,
                    user_id=self.user_id,
                    device_id=device_id,
                    vendor=vendor,
                    command=command,
                    line_number=line_number,
                    ai_suggestion=json.dumps(ai_suggestion) if isinstance(ai_suggestion, dict) else None,
                )
            )
        self.db.commit()

    def list_unknown_commands(self) -> List[Dict[str, Any]]:
        query = self.db.query(UnknownCommand).filter(UnknownCommand.resolved.is_(False))
        if self.user_id is not None:
            query = query.filter(UnknownCommand.user_id == self.user_id)
        records = query.order_by(UnknownCommand.id.desc()).all()
        results: List[Dict[str, Any]] = []
        for record in records:
            ai_suggestion = None
            if record.ai_suggestion:
                try:
                    ai_suggestion = json.loads(record.ai_suggestion)
                except (TypeError, ValueError):
                    ai_suggestion = record.ai_suggestion

            results.append({
                "id": record.id,
                "vendor": record.vendor,
                "command": record.command,
                "audit_id": record.audit_id,
                "line_number": record.line_number,
                "ai_suggestion": ai_suggestion,
            })
        return results

    def create_report(self, audit_id: int, title: str, file_name: str, summary: Optional[str] = None) -> Report:
        report = Report(audit_id=audit_id, user_id=self.user_id, title=title, file_name=file_name, summary=summary)
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        return report

    def list_reports(self) -> List[Report]:
        query = self.db.query(Report)
        if self.user_id is not None:
            query = query.filter(Report.user_id == self.user_id)
        return query.order_by(Report.id.desc()).all()
