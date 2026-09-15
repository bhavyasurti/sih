import re
from typing import Any, Dict


def detect_vendor(config_text: str) -> Dict[str, Any]:
    text = (config_text or "").lower()
    score = {
        "cisco": 0,
        "fortinet": 0,
        "paloalto": 0,
        "juniper": 0,
        "aruba": 0,
        "checkpoint": 0,
    }

    cisco_patterns = [
        r"\bversion\s+\d",
        r"\bhostname\s+",
        r"\bip\s+ssh\b",
        r"\bline\s+vty\b",
        r"\binterface\s+gigabitethernet\b",
        r"\btransport\s+input\b",
        r"\bservice\s+timestamps\b",
    ]
    fortinet_patterns = [
        r"config\s+system\s+global",
        r"config\s+system\s+interface",
        r"config\s+firewall\s+policy",
        r"set\s+hostname",
        r"set\s+ssh-version",
        r"set\s+allowaccess",
        r"set\s+admin-ssh-grace-time",
    ]
    paloalto_patterns = [
        r"set\s+deviceconfig\s+system",
        r"set\s+network\s+interface",
        r"set\s+rulebase",
        r"configure",
        r"set\s+deviceconfig\s+security",
    ]
    juniper_patterns = [
        r"\bsystem\s+\{",
        r"\bhost-name\b",
        r"\bservices\s+\{\s*ssh",
        r"set\s+system\s+host-name",
        r"\binterfaces\s+\{",
    ]
    aruba_patterns = [
        r"\bssh\s+server\s+vrf\b",
        r"\binterface\s+\d+/\d+/\d+\b",
        r"\baruba-central\b",
        r"\bmodule\s+\d+\b",
        r"vlan\s+\d+",
    ]
    checkpoint_patterns = [
        r"set\s+hostname\b",
        r"set\s+clienv\b",
        r"add\s+user\b",
        r"set\s+expert-password\b",
        r"set\s+netflow\b",
    ]

    for pattern in cisco_patterns:
        if re.search(pattern, text):
            score["cisco"] += 1

    for pattern in fortinet_patterns:
        if re.search(pattern, text):
            score["fortinet"] += 1

    for pattern in paloalto_patterns:
        if re.search(pattern, text):
            score["paloalto"] += 1

    for pattern in juniper_patterns:
        if re.search(pattern, text):
            score["juniper"] += 1

    for pattern in aruba_patterns:
        if re.search(pattern, text):
            score["aruba"] += 1

    for pattern in checkpoint_patterns:
        if re.search(pattern, text):
            score["checkpoint"] += 1

    if not any(score.values()):
        return {
            "vendor": "unknown",
            "confidence": 0.0,
            "method": "signature",
        }

    top_vendor = max(score, key=score.get)
    best_score = score[top_vendor]
    total_score = sum(score.values())
    confidence = round(best_score / total_score, 2) if total_score else 0.0

    if best_score == 0:
        vendor = "unknown"
        confidence = 0.0
    else:
        vendor = top_vendor

    return {
        "vendor": vendor,
        "confidence": round(confidence, 2) if vendor != "unknown" else 0.0,
        "method": "signature",
    }
