import re
from typing import Any, Dict


def parse_fortios_config(config_text: str) -> Dict[str, Any]:
    text = config_text or ""
    lines = text.splitlines()

    result: Dict[str, Any] = {
        "device": {
            "hostname": None,
            "vendor": "fortinet",
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

    hostname_match = re.search(r"set\s+hostname\s+(\S+)", text, re.IGNORECASE)
    if hostname_match:
        result["device"]["hostname"] = hostname_match.group(1)

    ssh_version_match = re.search(r"set\s+ssh-version\s+(\d+)", text, re.IGNORECASE)
    if ssh_version_match:
        result["security"]["ssh_version"] = int(ssh_version_match.group(1))
        result["security"]["ssh_enabled"] = True

    if re.search(r"set\s+allowaccess\s+.*ssh", text, re.IGNORECASE):
        result["security"]["ssh_enabled"] = True
    if re.search(r"set\s+allowaccess\s+.*telnet", text, re.IGNORECASE):
        result["security"]["telnet_enabled"] = True
    if re.search(r"set\s+allowaccess\s+.*http", text, re.IGNORECASE):
        result["security"]["http_enabled"] = True
    if re.search(r"set\s+allowaccess\s+.*https", text, re.IGNORECASE):
        result["security"]["https_enabled"] = True

    if re.search(r"set\s+admin-ssh-grace-time\s+(\d+)", text, re.IGNORECASE):
        timeout = re.search(r"set\s+admin-ssh-grace-time\s+(\d+)", text, re.IGNORECASE)
        result["security"]["login_timeout"] = int(timeout.group(1))

    if re.search(r"set\s+log|log\s+setting|config\s+log", text, re.IGNORECASE):
        result["security"]["logging_enabled"] = True

    if re.search(r"set\s+ntp\s+server|config\s+system\s+ntp", text, re.IGNORECASE):
        result["security"]["ntp_configured"] = True

    if re.search(r"config\s+system\s+interface|config\s+firewall\s+policy", text, re.IGNORECASE):
        for line in lines:
            stripped = line.strip()
            if stripped.startswith("set interface") or stripped.startswith("set name"):
                result["network"]["interfaces"].append({"name": stripped})

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if re.search(r"^(set\s+hostname|set\s+ssh-version|set\s+allowaccess|set\s+admin-ssh-grace-time|config\s+system\s+global|config\s+system\s+interface|config\s+firewall\s+policy|set\s+ntp|set\s+log)", stripped, re.IGNORECASE):
            continue
        result["unknown_commands"].append({
            "command": stripped,
            "vendor": "fortinet",
            "line_number": idx,
        })

    if result["security"]["ssh_enabled"] is None and result["security"]["ssh_version"] is not None:
        result["security"]["ssh_enabled"] = True

    return result
