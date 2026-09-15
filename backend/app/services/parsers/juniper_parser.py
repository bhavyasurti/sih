import re
from typing import Any, Dict

def parse_juniper_config(config_text: str) -> Dict[str, Any]:
    text = config_text or ""
    lines = text.splitlines()

    result: Dict[str, Any] = {
        "device": {
            "hostname": None,
            "vendor": "juniper",
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

    # Hostname (set or hierarchical)
    hostname_match = re.search(r"host-name\s+([\w.-]+);", text)
    if not hostname_match:
        hostname_match = re.search(r"set\s+system\s+host-name\s+([\w.-]+)", text)
    if hostname_match:
        result["device"]["hostname"] = hostname_match.group(1)

    # OS Version (often in header)
    version_match = re.search(r"version\s+([\w.-]+);", text)
    if version_match:
        result["device"]["os_version"] = version_match.group(1)

    # SSH
    if re.search(r"services\s*\{\s*[^}]*ssh\s*\{", text) or re.search(r"set\s+system\s+services\s+ssh", text):
        result["security"]["ssh_enabled"] = True
        
        protocol_match = re.search(r"protocol-version\s+(v2|v1)", text)
        if protocol_match:
            result["security"]["ssh_version"] = 2 if protocol_match.group(1) == "v2" else 1

    # Telnet
    if re.search(r"services\s*\{\s*[^}]*telnet\s*\{", text) or re.search(r"set\s+system\s+services\s+telnet", text):
        result["security"]["telnet_enabled"] = True
    else:
        result["security"]["telnet_enabled"] = False

    # HTTP/HTTPS (web-management)
    if re.search(r"web-management\s*\{\s*[^}]*http\s*\{", text) or re.search(r"set\s+system\s+services\s+web-management\s+http", text):
        result["security"]["http_enabled"] = True
    
    if re.search(r"web-management\s*\{\s*[^}]*https\s*\{", text) or re.search(r"set\s+system\s+services\s+web-management\s+https", text):
        result["security"]["https_enabled"] = True

    # Logging
    if re.search(r"syslog\s*\{", text) or re.search(r"set\s+system\s+syslog", text):
        result["security"]["logging_enabled"] = True

    # NTP
    if re.search(r"ntp\s*\{\s*server", text) or re.search(r"set\s+system\s+ntp\s+server", text):
        result["security"]["ntp_configured"] = True

    # SNMP
    if re.search(r"snmp\s*\{", text) or re.search(r"set\s+snmp", text):
        if re.search(r"v3", text, re.IGNORECASE):
            result["security"]["snmp_secure"] = True
        else:
            result["security"]["snmp_secure"] = False

    # Unknown commands
    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("/*"):
            continue

        if re.search(r"^(set|delete|edit|top|up|exit|system|interfaces|protocols|policy-options|routing-options|firewall|snmp)", stripped, re.IGNORECASE):
            continue

        if stripped.endswith("}") or stripped.endswith("{"):
            continue

        result["unknown_commands"].append({
            "command": stripped,
            "vendor": "juniper",
            "line_number": idx,
        })

    return result
