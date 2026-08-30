from __future__ import annotations

from typing import Any, Dict, List

from app.services.compliance.rule_registry import get_controls_for_framework


CONTROL_ID_ORDER = [
    "NIST-NET-AC-001",
    "NIST-NET-CM-001",
    "NIST-NET-AU-001",
]


def get_nist_controls() -> List[Dict[str, Any]]:
    controls = get_controls_for_framework("NIST")
    ordered = []
    for control_id in CONTROL_ID_ORDER:
        for control in controls:
            if control["control_id"] == control_id:
                ordered.append(control)
                break
    return ordered
