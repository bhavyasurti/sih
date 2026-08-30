from __future__ import annotations

import io
from fastapi.testclient import TestClient

from app.main import app
from app.services.reporting.report_generator import generate_compliance_pdf


client = TestClient(app)


def test_generate_compliance_pdf_returns_valid_bytes():
    audit_data = {
        "id": 101,
        "title": "CORE-RTR-01.cfg",
        "status": "compliant",
        "compliance_score": 85.0,
        "device": {
            "hostname": "CORE-RTR-01",
            "vendor": "cisco",
            "model": "Cisco Catalyst 9300",
            "os_version": "17.3.3",
        },
    }
    compliance_data = {
        "score": 85.0,
        "framework": "CIS",
        "vendor": "cisco",
        "overall_risk": "High",
        "summary": {"passed": 8, "failed": 2, "unknown": 0},
    }
    findings = [
        {
            "control_id": "CIS-NET-001",
            "title": "SSH Version 2 Enabled",
            "severity": "HIGH",
            "status": "PASS",
            "finding": "SSH version 2 should be used.",
            "current_state": "2",
            "remediation": None,
        },
        {
            "control_id": "CIS-NET-002",
            "title": "Telnet Disabled",
            "severity": "CRITICAL",
            "status": "FAIL",
            "finding": "Telnet should not be enabled.",
            "current_state": "True",
            "remediation": "configure terminal\nline vty 0 4\n transport input ssh\nend\nwrite memory",
        },
    ]

    pdf_bytes = generate_compliance_pdf(audit_data, compliance_data, findings)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 500
    assert pdf_bytes.startswith(b"%PDF-")


def test_report_endpoint_with_uploaded_audit():
    cisco_config = """hostname TEST-EDGE-01
version 15.2
ip ssh version 1
line vty 0 4
 transport input telnet
ip http server
"""
    # 1. Upload audit
    upload_res = client.post(
        "/api/audits/upload",
        files={"file": ("test_edge_01.cfg", cisco_config.encode("utf-8"), "text/plain")},
    )
    assert upload_res.status_code == 200
    audit_id = upload_res.json()["audit_id"]

    # 2. Analyze audit
    analyze_res = client.post(f"/api/audits/{audit_id}/analyze", json={"ai_enabled": False})
    assert analyze_res.status_code == 200

    # 3. Evaluate compliance
    comp_res = client.post(f"/api/audits/{audit_id}/compliance", json={"framework": "CIS"})
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert "findings" in comp_data
    assert any(f.get("status") == "FAIL" and f.get("remediation") for f in comp_data["findings"])

    # 4. Generate PDF report
    report_res = client.get(f"/api/audits/{audit_id}/report")
    assert report_res.status_code == 200
    assert report_res.headers.get("content-type") == "application/pdf"
    assert report_res.content.startswith(b"%PDF-")


def test_report_endpoint_404_for_nonexistent_audit():
    report_res = client.get("/api/audits/99999999/report")
    assert report_res.status_code == 404
