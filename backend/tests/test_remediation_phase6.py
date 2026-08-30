from __future__ import annotations

from typing import Any

from app.services.compliance.engine import evaluate
from app.services.remediation.engine import (
    MANUAL_REMEDIATION,
    calculate_overall_risk,
    enrich_compliance_result,
    enrich_findings_with_remediation,
    generate_remediation,
    normalize_vendor,
    vendor_label,
)


def test_normalize_vendor_variants():
    assert normalize_vendor("cisco") == "cisco"
    assert normalize_vendor("Cisco IOS") == "cisco"
    assert normalize_vendor("cisco-ios") == "cisco"
    assert normalize_vendor("fortinet") == "fortinet"
    assert normalize_vendor("Fortinet FortiOS") == "fortinet"
    assert normalize_vendor("FortiGate") == "fortinet"
    assert normalize_vendor("paloalto") == "paloalto"
    assert normalize_vendor("Palo Alto PAN-OS") == "paloalto"
    assert normalize_vendor("pan-os") == "paloalto"
    assert normalize_vendor("juniper") == "unknown"
    assert normalize_vendor(None) == "unknown"


def test_cisco_deterministic_remediations():
    finding_ssh = {
        "control_id": "CIS-NET-001",
        "title": "SSH Version 2 Enabled",
        "severity": "HIGH",
        "status": "FAIL",
        "actual": 1,
        "description": "SSH version 2 should be used.",
    }
    rem = generate_remediation(finding_ssh, "cisco")
    assert rem["available"] is True
    assert "ip ssh version 2" in rem["cli"]
    assert rem["vendor"] == "cisco"
    assert rem["current_state"] == "1"
    assert rem["remediation"] == rem["cli"]

    finding_telnet = {
        "control_id": "CIS-NET-002",
        "title": "Telnet Disabled",
        "severity": "CRITICAL",
        "status": "FAIL",
        "actual": True,
        "description": "Telnet should not be enabled.",
    }
    rem_telnet = generate_remediation(finding_telnet, "cisco")
    assert rem_telnet["available"] is True
    assert "transport input ssh" in rem_telnet["cli"]

    finding_http = {
        "control_id": "CIS-NET-003",
        "title": "Insecure HTTP Management Disabled",
        "severity": "HIGH",
        "status": "FAIL",
        "actual": True,
        "description": "HTTP administrative access should be disabled.",
    }
    rem_http = generate_remediation(finding_http, "cisco")
    assert rem_http["available"] is True
    assert "no ip http server" in rem_http["cli"]


def test_fortinet_deterministic_remediations():
    finding_ssh = {
        "control_id": "CIS-NET-001",
        "title": "SSH Version 2 Enabled",
        "severity": "HIGH",
        "status": "FAIL",
        "actual": 1,
        "description": "SSH version 2 should be used.",
    }
    rem_ssh = generate_remediation(finding_ssh, "fortinet")
    assert rem_ssh["available"] is True
    assert "config system global" in rem_ssh["cli"]
    assert "set ssh-version 2" in rem_ssh["cli"]

    finding_timeout = {
        "control_id": "CIS-NET-007",
        "title": "Administrative Login Timeout Configured",
        "severity": "MEDIUM",
        "status": "FAIL",
        "actual": 0,
        "description": "Administrative sessions should have a reasonable timeout.",
    }
    rem_timeout = generate_remediation(finding_timeout, "fortinet")
    assert rem_timeout["available"] is True
    assert "set admintimeout 5" in rem_timeout["cli"]

    finding_ntp = {
        "control_id": "CIS-NET-006",
        "title": "Network Time Protocol Configured",
        "severity": "MEDIUM",
        "status": "FAIL",
        "actual": False,
        "description": "NTP should be configured.",
    }
    rem_ntp = generate_remediation(finding_ntp, "fortinet")
    assert rem_ntp["available"] is True
    assert "set ntpsync enable" in rem_ntp["cli"]


def test_panos_deterministic_remediations():
    finding_ssh = {
        "control_id": "CIS-NET-001",
        "title": "SSH Version 2 Enabled",
        "severity": "HIGH",
        "status": "FAIL",
        "actual": 1,
        "description": "SSH version 2 should be used.",
    }
    rem_ssh = generate_remediation(finding_ssh, "paloalto")
    assert rem_ssh["available"] is True
    assert "set deviceconfig system ssh version 2" in rem_ssh["cli"]

    finding_telnet = {
        "control_id": "CIS-NET-002",
        "title": "Telnet Disabled",
        "severity": "CRITICAL",
        "status": "FAIL",
        "actual": True,
        "description": "Telnet should not be enabled.",
    }
    rem_telnet = generate_remediation(finding_telnet, "paloalto")
    assert rem_telnet["available"] is True
    assert "set deviceconfig system service disable-telnet yes" in rem_telnet["cli"]


def test_unsupported_vendor_fallback():
    finding = {
        "control_id": "CIS-NET-001",
        "title": "SSH Version 2 Enabled",
        "severity": "HIGH",
        "status": "FAIL",
        "actual": 1,
        "description": "SSH version 2 should be used.",
    }
    rem = generate_remediation(finding, "juniper")
    assert rem["available"] is False
    assert rem["remediation"] == MANUAL_REMEDIATION
    assert rem["cli"] == MANUAL_REMEDIATION
    assert rem["remediation_action"] == MANUAL_REMEDIATION


def test_unmapped_control_fallback():
    finding = {
        "control_id": "CUSTOM-CTRL-999",
        "title": "Custom Control",
        "severity": "HIGH",
        "status": "FAIL",
        "actual": "unknown",
        "description": "Custom check.",
    }
    rem = generate_remediation(finding, "cisco")
    assert rem["available"] is False
    assert rem["remediation"] == MANUAL_REMEDIATION
    assert rem["cli"] == MANUAL_REMEDIATION


def test_overall_risk_calculation():
    critical_findings = [{"status": "FAIL", "severity": "CRITICAL"}, {"status": "PASS", "severity": "LOW"}]
    assert calculate_overall_risk(critical_findings) == "Critical"

    high_findings = [{"status": "FAIL", "severity": "HIGH"}, {"status": "PASS", "severity": "LOW"}]
    assert calculate_overall_risk(high_findings) == "High"

    medium_findings = [{"status": "FAIL", "severity": "MEDIUM"}, {"status": "PASS", "severity": "LOW"}]
    assert calculate_overall_risk(medium_findings) == "Medium"

    passed_findings = [{"status": "PASS", "severity": "HIGH"}, {"status": "PASS", "severity": "CRITICAL"}]
    assert calculate_overall_risk(passed_findings) == "Low"


def test_enrich_compliance_result_structure():
    normalized = {
        "security": {
            "ssh_version": 1,
            "telnet_enabled": True,
            "http_enabled": True,
        }
    }
    raw_compliance = evaluate(normalized, "CIS")
    enriched = enrich_compliance_result(raw_compliance, "cisco")

    assert "overall_risk" in enriched
    assert "total_controls" in enriched
    assert len(enriched["findings"]) > 0

    failed_ssh = next((f for f in enriched["findings"] if f["control_id"] == "CIS-NET-001"), None)
    assert failed_ssh is not None
    assert failed_ssh["status"] == "FAIL"
    assert failed_ssh["vendor"] == "cisco"
    assert "ip ssh version 2" in failed_ssh["remediation"]
    assert "control" in failed_ssh
    assert "current_state" in failed_ssh


def test_remediation_is_deterministic_without_ai():
    # Calling remediation multiple times on the same finding yields identical outputs
    finding = {
        "control_id": "CIS-NET-002",
        "title": "Telnet Disabled",
        "severity": "CRITICAL",
        "status": "FAIL",
        "actual": True,
        "description": "Telnet should not be enabled.",
    }
    res1 = generate_remediation(finding, "cisco")
    res2 = generate_remediation(finding, "cisco")
    assert res1 == res2
    assert res1["cli"] == res2["cli"]
