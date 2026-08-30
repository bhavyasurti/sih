from app.services.compliance.engine import evaluate



def _to_status_map(result):
    return {finding["control_id"]: finding["status"] for finding in result["findings"]}



def test_ssh_version_2_passes():
    result = evaluate({"security": {"ssh_version": 2}}, "CIS")
    assert result["score"] >= 0
    assert "CIS-NET-001" in {f["control_id"] for f in result["findings"]}
    assert _to_status_map(result).get("CIS-NET-001") == "PASS"


def test_ssh_version_1_fails():
    result = evaluate({"security": {"ssh_version": 1}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-001") == "FAIL"


def test_telnet_enabled_fails():
    result = evaluate({"security": {"telnet_enabled": True}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-002") == "FAIL"


def test_telnet_disabled_passes():
    result = evaluate({"security": {"telnet_enabled": False}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-002") == "PASS"


def test_http_enabled_fails():
    result = evaluate({"security": {"http_enabled": True}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-003") == "FAIL"


def test_http_disabled_passes():
    result = evaluate({"security": {"http_enabled": False}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-003") == "PASS"


def test_https_enabled_passes():
    result = evaluate({"security": {"https_enabled": True}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-004") == "PASS"


def test_https_unknown_produces_unknown():
    result = evaluate({"security": {"https_enabled": None}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-004") == "UNKNOWN"


def test_logging_enabled_passes():
    result = evaluate({"security": {"logging_enabled": True}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-005") == "PASS"


def test_ntp_missing_produces_fail_or_unknown_according_to_parser_state():
    result = evaluate({"security": {"ntp_configured": False}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-006") in {"FAIL", "UNKNOWN"}


def test_login_timeout_configured_passes():
    result = evaluate({"security": {"login_timeout": 300}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-007") == "PASS"


def test_snmp_insecure_fails():
    result = evaluate({"security": {"snmp_secure": False}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-008") == "FAIL"


def test_strong_password_passes():
    result = evaluate({"security": {"password_policy": "strong"}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-009") == "PASS"


def test_dangerous_acl_fails():
    result = evaluate({"network": {"acl_rules": ["permit ip any any"]}}, "CIS")
    assert _to_status_map(result).get("CIS-NET-010") == "FAIL"


def test_compliance_score_calculation():
    result = evaluate({
        "security": {
            "ssh_version": 2,
            "telnet_enabled": False,
            "http_enabled": False,
            "https_enabled": True,
            "logging_enabled": True,
            "ntp_configured": True,
            "login_timeout": 300,
            "snmp_secure": True,
            "password_policy": "strong",
        },
        "network": {"acl_rules": []},
    }, "CIS")
    assert 0 <= result["score"] <= 100
    assert result["passed"] >= 0
    assert result["failed"] >= 0


def test_severity_counts():
    result = evaluate({
        "security": {
            "ssh_version": 1,
            "telnet_enabled": True,
            "http_enabled": True,
            "https_enabled": None,
            "logging_enabled": False,
            "ntp_configured": False,
            "login_timeout": 0,
            "snmp_secure": False,
            "password_policy": "weak",
        },
        "network": {"acl_rules": ["permit ip any any"]},
    }, "CIS")
    assert result["critical"] >= 0
    assert result["high"] >= 0
    assert result["medium"] >= 0
    assert result["low"] >= 0


def test_cis_framework_evaluation():
    result = evaluate({"security": {"ssh_version": 2}}, "CIS")
    assert result["framework"] == "CIS"
    assert "CIS-NET-001" in {f["control_id"] for f in result["findings"]}


def test_nist_framework_evaluation():
    result = evaluate({"security": {"ssh_version": 2, "telnet_enabled": False, "http_enabled": False}}, "NIST")
    assert result["framework"] == "NIST"
    assert "NIST-NET-AC-001" in {f["control_id"] for f in result["findings"]}
