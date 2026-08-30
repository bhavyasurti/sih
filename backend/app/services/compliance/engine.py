from __future__ import annotations

from typing import Any, Dict, List

from app.services.compliance.evaluator import build_summary, evaluate_control
from app.services.compliance.framework_cis import get_cis_controls
from app.services.compliance.framework_nist import get_nist_controls



def evaluate(normalized_config: Dict[str, Any], framework: str) -> Dict[str, Any]:
    framework_name = (framework or "CIS").upper()
    if framework_name == "CIS":
        controls = get_cis_controls()
    elif framework_name == "NIST":
        controls = get_nist_controls()
    else:
        raise ValueError(f"Unsupported framework: {framework}")

    findings = []
    for control in controls:
        result = evaluate_control(control, normalized_config or {})
        findings.append(result)

    summary = build_summary(findings)
    summary_payload = {
        "framework": framework_name,
        "score": summary["score"],
        "passed": summary["passed"],
        "failed": summary["failed"],
        "unknown": summary["unknown"],
        "critical": summary["critical"],
        "high": summary["high"],
        "medium": summary["medium"],
        "low": summary["low"],
        "findings": findings,
    }
    return summary_payload
