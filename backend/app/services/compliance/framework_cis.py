from __future__ import annotations

from typing import Any, Dict, List

from app.services.compliance.rule_registry import get_controls_for_framework


CONTROL_ID_ORDER = [
    "CIS-NET-001",
    "CIS-NET-002",
    "CIS-NET-003",
    "CIS-NET-004",
    "CIS-NET-005",
    "CIS-NET-006",
    "CIS-NET-007",
    "CIS-NET-008",
    "CIS-NET-009",
    "CIS-NET-010",
]


def get_cis_controls() -> List[Dict[str, Any]]:
    controls = get_controls_for_framework("CIS")
    ordered = []
    for control_id in CONTROL_ID_ORDER:
        for control in controls:
            if control["control_id"] == control_id:
                ordered.append(control)
                break
    return ordered
