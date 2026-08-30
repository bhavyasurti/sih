from app.services.parsers.vendor_detector import detect_vendor
from app.services.parsers.normalizer import normalize_security_data
from app.services.parsers.ios_parser import parse_ios_config
from app.services.parsers.fortios_parser import parse_fortios_config
from app.services.parsers.panos_parser import parse_panos_config


def test_cisco_vendor_detection():
    text = """
    hostname CORE-RTR-01
    version 15.2
    ip ssh version 2
    line vty 0 4
    transport input telnet ssh
    """
    result = detect_vendor(text)
    assert result["vendor"] == "cisco"
    assert result["confidence"] > 0.5


def test_fortinet_vendor_detection():
    text = """
    config system global
    set hostname FGT-01
    config firewall policy
    set allowaccess ssh https
    set ssh-version 2
    """
    result = detect_vendor(text)
    assert result["vendor"] == "fortinet"


def test_palo_alto_vendor_detection():
    text = """
    set deviceconfig system hostname PA-01
    set network interface ethernet ethernet1/1 layer3
    set deviceconfig system service disable-telnet yes
    """
    result = detect_vendor(text)
    assert result["vendor"] == "paloalto"


def test_cisco_ssh_parsing():
    text = """
    hostname CORE-RTR-01
    ip ssh version 2
    ip ssh time-out 120
    """
    result = parse_ios_config(text)
    assert result["security"]["ssh_enabled"] is True
    assert result["security"]["ssh_version"] == 2


def test_cisco_telnet_parsing():
    text = """
    line vty 0 4
    transport input telnet
    """
    result = parse_ios_config(text)
    assert result["security"]["telnet_enabled"] is True


def test_cisco_http_parsing():
    text = """
    ip http server
    ip http secure-server
    """
    result = parse_ios_config(text)
    assert result["security"]["http_enabled"] is True
    assert result["security"]["https_enabled"] is True


def test_fortinet_ssh_parsing():
    text = """
    set hostname FGT-01
    set ssh-version 2
    set allowaccess ssh https
    """
    result = parse_fortios_config(text)
    assert result["security"]["ssh_enabled"] is True
    assert result["security"]["ssh_version"] == 2


def test_palo_alto_telnet_parsing():
    text = """
    set deviceconfig system hostname PA-01
    set deviceconfig system service disable-telnet no
    """
    result = parse_panos_config(text)
    assert result["security"]["telnet_enabled"] is True


def test_normalization_schema():
    raw = {
        "device": {"hostname": "CORE-RTR-01", "vendor": "cisco", "model": None, "serial_number": None, "os_version": "15.2"},
        "security": {"ssh_enabled": True, "ssh_version": 2, "telnet_enabled": False, "http_enabled": False, "https_enabled": True, "logging_enabled": True, "ntp_configured": False, "snmp_secure": False, "login_timeout": 300, "password_policy": "unknown"},
        "network": {"interfaces": [], "acl_rules": []},
        "unknown_commands": [],
    }
    normalized = normalize_security_data(raw)
    assert normalized["device"]["hostname"] == "CORE-RTR-01"
    assert normalized["security"]["ssh_version"] == 2


def test_unknown_command_detection():
    text = """
    set management-access ssh-timeout 300
    set route static 0.0.0.0/0 192.168.1.1
    """
    result = parse_panos_config(text)
    assert len(result.get("unknown_commands", [])) >= 1
