import re
from typing import Any, Dict


def parse_panos_config(config_text: str) -> Dict[str, Any]:
    text = config_text or ""
    lines = text.splitlines()

    result: Dict[str, Any] = {
        "device": {
            "hostname": None,
            "vendor": "paloalto",
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

    hostname_match = re.search(r"set\s+deviceconfig\s+system\s+hostname\s+(\S+)", text, re.IGNORECASE)
    if hostname_match:
        result["device"]["hostname"] = hostname_match.group(1)

    if re.search(r"set\s+deviceconfig\s+system\s+service\s+disable-telnet\s+yes", text, re.IGNORECASE):
        result["security"]["telnet_enabled"] = False
    elif re.search(r"set\s+deviceconfig\s+system\s+service\s+disable-telnet\s+no", text, re.IGNORECASE):
        result["security"]["telnet_enabled"] = True

    if re.search(r"set\s+deviceconfig\s+system\s+service\s+disable-http\s+yes", text, re.IGNORECASE):
        result["security"]["http_enabled"] = False
    elif re.search(r"set\s+deviceconfig\s+system\s+service\s+disable-http\s+no", text, re.IGNORECASE):
        result["security"]["http_enabled"] = True

    if re.search(r"set\s+deviceconfig\s+system\s+service\s+disable-https\s+yes", text, re.IGNORECASE):
        result["security"]["https_enabled"] = False
    elif re.search(r"set\s+deviceconfig\s+system\s+service\s+disable-https\s+no", text, re.IGNORECASE):
        result["security"]["https_enabled"] = True

    ssh_version_match = re.search(r"set\s+deviceconfig\s+system\s+ssh\s+version\s+(\d+)", text, re.IGNORECASE)
    if ssh_version_match:
        result["security"]["ssh_version"] = int(ssh_version_match.group(1))
        result["security"]["ssh_enabled"] = True

    if re.search(r"set\s+deviceconfig\s+system\s+service\s+disable-ssh\s+yes", text, re.IGNORECASE):
        result["security"]["ssh_enabled"] = False
    elif re.search(r"set\s+deviceconfig\s+system\s+service\s+disable-ssh\s+no", text, re.IGNORECASE):
        result["security"]["ssh_enabled"] = True

    if re.search(r"set\s+deviceconfig\s+system\s+ntp\s+server|set\s+deviceconfig\s+system\s+timezone", text, re.IGNORECASE):
        result["security"]["ntp_configured"] = True

    if re.search(r"set\s+deviceconfig\s+system\s+logging", text, re.IGNORECASE):
        result["security"]["logging_enabled"] = True

    if re.search(r"set\s+network\s+interface", text, re.IGNORECASE):
        for line in lines:
            if re.search(r"set\s+network\s+interface", line, re.IGNORECASE):
                result["network"]["interfaces"].append({"name": line.strip()})

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if re.search(r"^(set\s+deviceconfig\s+system|set\s+network\s+interface|set\s+rulebase|set\s+deviceconfig\s+security)", stripped, re.IGNORECASE):
            continue
        result["unknown_commands"].append({
            "command": stripped,
            "vendor": "paloalto",
            "line_number": idx,
        })

    if result["security"]["ssh_enabled"] is None and result["security"]["ssh_version"] is not None:
        result["security"]["ssh_enabled"] = True

    return result
