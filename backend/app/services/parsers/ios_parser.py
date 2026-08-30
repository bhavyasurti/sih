import re
from typing import Any, Dict, List


def parse_ios_config(config_text: str) -> Dict[str, Any]:
    text = config_text or ""
    lines = text.splitlines()

    result: Dict[str, Any] = {
        "device": {
            "hostname": None,
            "vendor": "cisco",
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

    hostname_match = re.search(r"^\s*hostname\s+(\S+)", text, re.IGNORECASE | re.MULTILINE)
    if hostname_match:
        result["device"]["hostname"] = hostname_match.group(1)

    version_match = re.search(r"^\s*version\s+([\d.]+)", text, re.IGNORECASE | re.MULTILINE)
    if version_match:
        result["device"]["os_version"] = version_match.group(1)

    ssh_match = re.search(r"ip\s+ssh\s+version\s+(\d+)", text, re.IGNORECASE)
    if ssh_match:
        result["security"]["ssh_version"] = int(ssh_match.group(1))
        result["security"]["ssh_enabled"] = True

    ssh_timeout_match = re.search(r"ip\s+ssh\s+time-out\s+(\d+)", text, re.IGNORECASE)
    if ssh_timeout_match:
        result["security"]["login_timeout"] = int(ssh_timeout_match.group(1))

    exec_timeout_match = re.search(r"exec-timeout\s+(\d+)", text, re.IGNORECASE)
    if exec_timeout_match:
        result["security"]["login_timeout"] = int(exec_timeout_match.group(1)) * 60

    telnet_lines = [line for line in lines if re.search(r"transport\s+input.*telnet", line, re.IGNORECASE)]
    if telnet_lines:
        result["security"]["telnet_enabled"] = True
        result["security"]["ssh_enabled"] = bool(re.search(r"transport\s+input.*ssh", "\n".join(telnet_lines), re.IGNORECASE))
    else:
        if any(re.search(r"transport\s+input\s+ssh", line, re.IGNORECASE) for line in lines):
            result["security"]["ssh_enabled"] = True
            result["security"]["telnet_enabled"] = False
        elif any(re.search(r"transport\s+input\s+.*telnet.*ssh", line, re.IGNORECASE) for line in lines):
            result["security"]["ssh_enabled"] = True
            result["security"]["telnet_enabled"] = True

    if re.search(r"no\s+ip\s+http\s+server", text, re.IGNORECASE):
        result["security"]["http_enabled"] = False
    elif re.search(r"ip\s+http\s+server", text, re.IGNORECASE):
        result["security"]["http_enabled"] = True

    if re.search(r"ip\s+http\s+secure-server", text, re.IGNORECASE):
        result["security"]["https_enabled"] = True

    if re.search(r"logging\s+host|logging\s+on|service\s+timestamps|logging\s+buffered", text, re.IGNORECASE):
        result["security"]["logging_enabled"] = True

    if re.search(r"ntp\s+server\b", text, re.IGNORECASE):
        result["security"]["ntp_configured"] = True

    if re.search(r"snmp-server\s+community|snmp-server\s+group|snmp-server\s+host", text, re.IGNORECASE):
        result["security"]["snmp_secure"] = False

    interface_matches = re.findall(r"^\s*interface\s+(\S+)", text, re.IGNORECASE | re.MULTILINE)
    for iface in interface_matches:
        result["network"]["interfaces"].append({"name": iface})

    acl_matches = re.findall(r"access-list\s+\S+\s+(permit|deny)\s+.*", text, re.IGNORECASE)
    for rule in acl_matches:
        result["network"]["acl_rules"].append(rule)

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("!"):
            continue

        if re.search(r"^\s*(hostname|version|ip\s+ssh|line\s+vty|transport\s+input|ip\s+http|logging|ntp|snmp-server|interface|access-list)", stripped, re.IGNORECASE):
            continue

        if re.search(r"^\s*(no\s+logging|no\s+ntp|no\s+service\s+pad|no\s+ip\s+http\s+server)", stripped, re.IGNORECASE):
            continue

        if not re.search(r"^\s*#|^\s*!|^\s*end$", stripped, re.IGNORECASE):
            result["unknown_commands"].append({
                "command": stripped,
                "vendor": "cisco",
                "line_number": idx,
            })

    if result["security"]["ssh_enabled"] is None and result["security"]["ssh_version"] is not None:
        result["security"]["ssh_enabled"] = True

    if result["security"]["telnet_enabled"] is None and any("transport input telnet" in line.lower() for line in lines):
        result["security"]["telnet_enabled"] = True

    return result
