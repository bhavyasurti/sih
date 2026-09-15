import re
from typing import Any, Dict

def parse_checkpoint_config(config_text: str) -> Dict[str, Any]:
    text = config_text or ""
    lines = text.splitlines()

    result: Dict[str, Any] = {
        "device": {
            "hostname": None,
            "vendor": "checkpoint",
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
    hostname_match = re.search(r"set\s+hostname\s+([\w.-]+)", text, re.IGNORECASE)
    if hostname_match:
        result["device"]["hostname"] = hostname_match.group(1)

    # OS Version
    version_match = re.search(r"R\d+.\d+", text, re.IGNORECASE)
    if version_match:
        result["device"]["os_version"] = version_match.group(0)

    # SSH
    if re.search(r"set\s+sshd", text, re.IGNORECASE):
        result["security"]["ssh_enabled"] = True

    # WebUI (HTTPS)
    if re.search(r"set\s+web\s+ssl-port", text, re.IGNORECASE) or re.search(r"set\s+web\s+daemon-enable\s+on", text, re.IGNORECASE):
        result["security"]["https_enabled"] = True

    # Logging
    if re.search(r"set\s+syslog", text, re.IGNORECASE):
        result["security"]["logging_enabled"] = True

    # NTP
    if re.search(r"set\s+ntp\s+server", text, re.IGNORECASE):
        result["security"]["ntp_configured"] = True

    # SNMP
    if re.search(r"set\s+snmp", text, re.IGNORECASE):
        if re.search(r"usm\s+user", text, re.IGNORECASE):
            result["security"]["snmp_secure"] = True

    # Password Policy
    if re.search(r"set\s+password-controls", text, re.IGNORECASE):
        result["security"]["password_policy"] = "configured"

    # Unknown commands
    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue

        if re.search(r"^(set\s+(hostname|sshd|web|syslog|ntp|snmp|password-controls|interface|static-route|expert-password)|add\s+(user|host))", stripped, re.IGNORECASE):
            continue

        result["unknown_commands"].append({
            "command": stripped,
            "vendor": "checkpoint",
            "line_number": idx,
        })

    return result
