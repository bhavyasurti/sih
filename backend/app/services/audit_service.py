from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.db.audit_repository import AuditRepository
from app.services.parsers.fortios_parser import parse_fortios_config
from app.services.parsers.ios_parser import parse_ios_config
from app.services.parsers.normalizer import normalize_security_data
from app.services.parsers.panos_parser import parse_panos_config
from app.services.parsers.vendor_detector import detect_vendor

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class AuditService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = AuditRepository(db)

    def analyze_audit_file(self, audit_id: int, filename: str) -> Dict[str, Any]:
        file_path = UPLOAD_DIR / filename
        if not file_path.exists():
            raise FileNotFoundError(f"Uploaded file not found: {filename}")

        config_text = file_path.read_text(encoding="utf-8", errors="ignore")
        detection = detect_vendor(config_text)
        vendor = detection["vendor"]

        parser_map = {
            "cisco": parse_ios_config,
            "fortinet": parse_fortios_config,
            "paloalto": parse_panos_config,
        }

        parser = parser_map.get(vendor)
        if parser is None:
            raise ValueError(f"No parser available for vendor: {vendor}")

        parsed = parser(config_text)
        normalized = normalize_security_data(parsed)

        audit = self.repository.get_audit(audit_id)
        if audit is not None:
            audit.status = "analyzed"
            audit.summary = f"Detected vendor: {vendor}"
            self.db.commit()

        return {
            "audit_id": audit_id,
            "vendor": vendor,
            "vendor_confidence": detection["confidence"],
            "device": normalized["device"],
            "security": normalized["security"],
            "network": normalized["network"],
            "unknown_commands": parsed.get("unknown_commands", []),
        }
