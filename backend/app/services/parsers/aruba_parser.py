import re
from typing import Any, Dict

def parse_aruba_config(config_text: str) -> Dict[str, Any]:
    text = config_text or ""
    lines = text.splitlines()

    result: Dict[str, Any] = {
        "device": {
            "hostname": None,
            "vendor": "aruba",
            "model": None,
            "serial_number": None,
            "os_version": None,
        },
        "security": {
            "ssh_enabled": None,
            "ssh_version": None,
            "telnet_enabled": None,
            "http_enabled": None,
            "https_enabled": None,
            "logging_enabled": None,
            "ntp_configured": None,
            "snmp_secure": None,
            "login_timeout": None,
            "password_policy": "unknown",
        },
        "network": {
            "interfaces": [],
            "acl_rules": [],
        },
        "unknown_commands": [],
    }

    # Hostname
    hostname_match = re.search(r"^\s*hostname\s+(\S+)", text, re.IGNORECASE | re.MULTILINE)
    if hostname_match:
        result["device"]["hostname"] = hostname_match.group(1)

    # OS Version
    # E.g., !! Software Version FL.10.13.1000
    version_match = re.search(r"Software Version\s+([\w.-]+)", text, re.IGNORECASE)
    if version_match:
        result["device"]["os_version"] = version_match.group(1)

    # SSH
    if re.search(r"ssh\s+server\s+vrf", text, re.IGNORECASE) or re.search(r"ssh\s+server\s+enable", text, re.IGNORECASE):
        result["security"]["ssh_enabled"] = True

    # Telnet
    if re.search(r"telnet-server\s+disable", text, re.IGNORECASE):
        result["security"]["telnet_enabled"] = False
    elif re.search(r"telnet\s+server\s+enable", text, re.IGNORECASE) or re.search(r"telnet-server", text, re.IGNORECASE):
        result["security"]["telnet_enabled"] = True
    else:
        result["security"]["telnet_enabled"] = False

    # HTTP/HTTPS
    if re.search(r"https-server\s+vrf", text, re.IGNORECASE) or re.search(r"web-management\s+https", text, re.IGNORECASE):
        result["security"]["https_enabled"] = True

    # Logging
    if re.search(r"logging\s+\d+\.\d+\.\d+\.\d+", text, re.IGNORECASE):
        result["security"]["logging_enabled"] = True

    # NTP
    if re.search(r"ntp\s+server", text, re.IGNORECASE):
        result["security"]["ntp_configured"] = True

    # SNMP
    if re.search(r"snmp-server\s+v3", text, re.IGNORECASE):
        result["security"]["snmp_secure"] = True

    # Unknown commands
    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("!") or stripped.startswith("#"):
            continue

        if re.search(r"^\s*(hostname|ssh|telnet|https-server|logging|ntp|snmp-server|interface|vlan|aruba-central)", stripped, re.IGNORECASE):
            continue

        result["unknown_commands"].append({
            "command": stripped,
            "vendor": "aruba",
            "line_number": idx,
        })

    return result
