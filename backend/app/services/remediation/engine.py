from __future__ import annotations

from typing import Any


MANUAL_REMEDIATION = "Manual remediation required"


VENDOR_LABELS = {
    "cisco": "Cisco IOS",
    "fortinet": "Fortinet FortiOS",
    "paloalto": "Palo Alto PAN-OS",
    "unknown": "unknown",
}


REMEDIATION_CATALOG: dict[str, dict[str, dict[str, str]]] = {
    "cisco": {
        "CIS-NET-001": {
            "action": "Configure management SSH to use protocol version 2.",
            "cli": "configure terminal\nip ssh version 2\nend\nwrite memory",
        },
        "CIS-NET-002": {
            "action": "Restrict VTY lines to SSH only and disable Telnet.",
            "cli": "configure terminal\nline vty 0 4\n transport input ssh\nend\nwrite memory",
        },
        "CIS-NET-003": {
            "action": "Disable the insecure HTTP administrative server.",
            "cli": "configure terminal\nno ip http server\nend\nwrite memory",
        },
        "CIS-NET-004": {
            "action": "Enable the secure HTTPS administrative server.",
            "cli": "configure terminal\nip http secure-server\nend\nwrite memory",
        },
        "CIS-NET-005": {
            "action": "Enable timestamps and local buffered administrative logging.",
            "cli": "configure terminal\nservice timestamps log datetime msec\nlogging buffered 4096\nend\nwrite memory",
        },
        "CIS-NET-007": {
            "action": "Configure an administrative session idle timeout on VTY lines.",
            "cli": "configure terminal\nline vty 0 4\n exec-timeout 5 0\nend\nwrite memory",
        },
        "CIS-NET-008": {
            "action": "Remove insecure default SNMP community string.",
            "cli": "configure terminal\nno snmp-server community public RO\nend\nwrite memory",
        },
        "NIST-NET-AC-001": {
            "action": "Configure management SSH to use protocol version 2.",
            "cli": "configure terminal\nip ssh version 2\nend\nwrite memory",
        },
        "NIST-NET-AU-001": {
            "action": "Enable local administrative logging.",
            "cli": "configure terminal\nservice timestamps log datetime msec\nlogging buffered 4096\nend\nwrite memory",
        },
    },
    "fortinet": {
        "CIS-NET-001": {
            "action": "Configure FortiOS administrative SSH to use protocol version 2.",
            "cli": "config system global\n set ssh-version 2\nend",
        },
        "CIS-NET-002": {
            "action": "Disable Telnet management access globally.",
            "cli": "config system global\n set admin-ssh-version 2\nend",
        },
        "CIS-NET-003": {
            "action": "Enforce HTTPS redirection and disable plain HTTP management.",
            "cli": "config system global\n set admin-https-redirect enable\nend",
        },
        "CIS-NET-004": {
            "action": "Enable HTTPS management redirection.",
            "cli": "config system global\n set admin-https-redirect enable\nend",
        },
        "CIS-NET-005": {
            "action": "Enable FortiOS system event logging.",
            "cli": "config log setting\n set status enable\nend",
        },
        "CIS-NET-006": {
            "action": "Enable NTP time synchronization.",
            "cli": "config system ntp\n set ntpsync enable\nend",
        },
        "CIS-NET-007": {
            "action": "Configure a 5-minute administrative idle timeout.",
            "cli": "config system global\n set admintimeout 5\nend",
        },
        "CIS-NET-008": {
            "action": "Remove insecure default public SNMP community.",
            "cli": "config system snmp community\n delete 1\nend",
        },
        "NIST-NET-AC-001": {
            "action": "Configure FortiOS administrative SSH to use version 2.",
            "cli": "config system global\n set ssh-version 2\nend",
        },
        "NIST-NET-CM-001": {
            "action": "Enable NTP time synchronization.",
            "cli": "config system ntp\n set ntpsync enable\nend",
        },
        "NIST-NET-AU-001": {
            "action": "Enable FortiOS system event logging.",
            "cli": "config log setting\n set status enable\nend",
        },
    },
    "paloalto": {
        "CIS-NET-001": {
            "action": "Configure PAN-OS administrative SSH to version 2.",
            "cli": "set deviceconfig system ssh version 2\ncommit",
        },
        "CIS-NET-002": {
            "action": "Disable Telnet administrative management service.",
            "cli": "set deviceconfig system service disable-telnet yes\ncommit",
        },
        "CIS-NET-003": {
            "action": "Disable plain HTTP administrative management service.",
            "cli": "set deviceconfig system service disable-http yes\ncommit",
        },
        "CIS-NET-004": {
            "action": "Enable secure HTTPS administrative service.",
            "cli": "set deviceconfig system service disable-https no\ncommit",
        },
        "CIS-NET-007": {
            "action": "Configure PAN-OS administrative session idle timeout.",
            "cli": "set deviceconfig system timeout 300\ncommit",
        },
        "NIST-NET-AC-001": {
            "action": "Configure PAN-OS administrative SSH to version 2.",
            "cli": "set deviceconfig system ssh version 2\ncommit",
        },
    },
}


def normalize_vendor(vendor: str | None) -> str:
    value = str(vendor or "unknown").strip().lower()
    compact = value.replace(" ", "").replace("-", "").replace("_", "")
    if "cisco" in compact or compact == "ios":
        return "cisco"
    if "fortinet" in compact or "fortios" in compact or "fortigate" in compact:
        return "fortinet"
    if "paloalto" in compact or "panos" in compact:
        return "paloalto"
    return "unknown"


def vendor_label(vendor: str | None) -> str:
    return VENDOR_LABELS.get(normalize_vendor(vendor), "unknown")


def calculate_overall_risk(findings: list[dict[str, Any]]) -> str:
    failed_severities = {
        str(finding.get("severity", "")).upper()
        for finding in findings
        if finding.get("status") == "FAIL"
    }
    if "CRITICAL" in failed_severities:
        return "Critical"
    if "HIGH" in failed_severities:
        return "High"
    if "MEDIUM" in failed_severities:
        return "Medium"
    if "LOW" in failed_severities:
        return "Low"
    if any(finding.get("status") == "UNKNOWN" for finding in findings):
        return "Unknown"
    return "Low"


def generate_remediation(finding: dict[str, Any], vendor: str | None) -> dict[str, Any]:
    normalized_vendor = normalize_vendor(vendor)
    control_id = str(finding.get("control_id", ""))
    command = REMEDIATION_CATALOG.get(normalized_vendor, {}).get(control_id)
    available = command is not None

    action_text = command["action"] if command else MANUAL_REMEDIATION
    cli_text = command["cli"] if command else MANUAL_REMEDIATION

    actual_val = finding.get("actual")
    current_state = str(actual_val) if actual_val is not None else "Not configured / Unknown"

    return {
        "control": control_id,
        "control_id": control_id,
        "control_name": finding.get("title", control_id),
        "title": finding.get("title", control_id),
        "severity": finding.get("severity", "MEDIUM"),
        "finding": finding.get("description") or finding.get("evidence") or finding.get("title", ""),
        "description": finding.get("description", ""),
        "current_state": current_state,
        "remediation": cli_text,
        "remediation_action": action_text,
        "vendor": normalized_vendor,
        "vendor_label": VENDOR_LABELS.get(normalized_vendor, "unknown"),
        "cli": cli_text,
        "available": available,
    }


def enrich_findings_with_remediation(findings: list[dict[str, Any]], vendor: str | None) -> list[dict[str, Any]]:
    enriched_findings: list[dict[str, Any]] = []
    normalized_vendor = normalize_vendor(vendor)

    for finding in findings:
        enriched = dict(finding)
        control_id = finding.get("control_id", "UNKNOWN")
        enriched["control"] = control_id
        enriched["vendor"] = normalized_vendor
        enriched["vendor_label"] = vendor_label(vendor)

        actual_val = finding.get("actual")
        enriched["current_state"] = str(actual_val) if actual_val is not None else "Not configured / Unknown"
        enriched["finding"] = finding.get("description") or finding.get("evidence") or finding.get("title", "")

        if finding.get("status") == "FAIL":
            remediation_info = generate_remediation(finding, vendor)
            enriched["remediation"] = remediation_info["cli"]
            enriched["remediation_action"] = remediation_info["remediation_action"]
            enriched["remediation_details"] = remediation_info
        elif finding.get("status") == "PASS":
            enriched["remediation"] = None
            enriched["remediation_details"] = None
        else:
            enriched["remediation"] = MANUAL_REMEDIATION
            enriched["remediation_details"] = None

        enriched_findings.append(enriched)
    return enriched_findings


def enrich_compliance_result(result: dict[str, Any], vendor: str | None) -> dict[str, Any]:
    findings = enrich_findings_with_remediation(list(result.get("findings", []) or []), vendor)
    enriched = dict(result)
    enriched["findings"] = findings
    enriched["overall_risk"] = calculate_overall_risk(findings)
    enriched["total_controls"] = len(findings)
    return enriched

