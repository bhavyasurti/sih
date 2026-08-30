from __future__ import annotations

import re
from typing import Any, Dict, List

from app.services.compliance.rule_registry import CONTROL_SEVERITY_WEIGHTS



def _normalize_boolean(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in {"true", "yes", "enabled", "allow", "allowed"}:
            return True
        if lowered in {"false", "no", "disabled", "deny", "denied"}:
            return False
    return bool(value)



def evaluate_control(control: Dict[str, Any], normalized_config: Dict[str, Any]) -> Dict[str, Any]:
    security = normalized_config.get("security", {})
    network = normalized_config.get("network", {})
    actual = security.get(control["parameter"]) if control["parameter"] in security else None
    if control["parameter"] == "acl_rules":
        actual = network.get("acl_rules", [])

    expected = control["expected_value"]
    status = "UNKNOWN"
    evidence = "No evidence available."
    description = control["description"]

    if control["evaluation_type"] == "equals":
        if actual is None:
            status = "UNKNOWN"
        elif actual == expected:
            status = "PASS"
        else:
            status = "FAIL"
        evidence = f"Expected {expected}, observed {actual}."

    elif control["evaluation_type"] == "gt_zero":
        if actual is None:
            status = "UNKNOWN"
        elif isinstance(actual, (int, float)) and actual > 0:
            status = "PASS"
        elif actual == 0:
            status = "FAIL"
        else:
            status = "UNKNOWN"
        evidence = f"Observed timeout value: {actual}."

    elif control["evaluation_type"] == "heuristic":
        rules = actual or []
        dangerous = False
        for rule in rules:
            normalized_rule = str(rule).lower().strip()
            if "permit ip any any" in normalized_rule or "permit any any" in normalized_rule or "allow any any" in normalized_rule:
                dangerous = True
                break
        if dangerous:
            status = "FAIL"
            evidence = f"Dangerous ACL rule detected: {rule}."
        elif rules:
            status = "PASS"
            evidence = "ACL rules exist but do not show unrestricted administrative access."
        else:
            status = "UNKNOWN"
            evidence = "No ACL evidence was found in the normalized model."

    if status == "PASS":
        actual_value = actual
        expected_value = expected
    else:
        actual_value = actual
        expected_value = expected

    result = {
        "control_id": control["control_id"],
        "framework": control["framework"],
        "title": control["title"],
        "status": status,
        "severity": control["severity"],
        "expected": expected_value,
        "actual": actual_value,
        "description": description,
        "evidence": evidence,
        "remediation": control["remediation"],
    }
    return result


def build_summary(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    passed = sum(1 for finding in findings if finding["status"] == "PASS")
    failed = sum(1 for finding in findings if finding["status"] == "FAIL")
    unknown = sum(1 for finding in findings if finding["status"] == "UNKNOWN")
    not_applicable = sum(1 for finding in findings if finding["status"] == "NOT_APPLICABLE")
    critical = sum(1 for finding in findings if finding["severity"] == "CRITICAL" and finding["status"] == "FAIL")
    high = sum(1 for finding in findings if finding["severity"] == "HIGH" and finding["status"] == "FAIL")
    medium = sum(1 for finding in findings if finding["severity"] == "MEDIUM" and finding["status"] == "FAIL")
    low = sum(1 for finding in findings if finding["severity"] == "LOW" and finding["status"] == "FAIL")

    evaluated = [finding for finding in findings if finding["status"] in {"PASS", "FAIL"}]
    passed_weight = sum(CONTROL_SEVERITY_WEIGHTS[finding["severity"]] for finding in evaluated if finding["status"] == "PASS")
    evaluated_weight = sum(CONTROL_SEVERITY_WEIGHTS[finding["severity"]] for finding in evaluated)
    score = round((passed_weight / evaluated_weight) * 100) if evaluated_weight else 0

    return {
        "score": score,
        "passed": passed,
        "failed": failed,
        "unknown": unknown,
        "not_applicable": not_applicable,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
    }
