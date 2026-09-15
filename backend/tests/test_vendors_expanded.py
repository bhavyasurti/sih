import pytest
from app.services.parsers.vendor_detector import detect_vendor
from app.services.parsers.juniper_parser import parse_juniper_config
from app.services.parsers.aruba_parser import parse_aruba_config
from app.services.parsers.checkpoint_parser import parse_checkpoint_config
from app.services.parsers.normalizer import normalize_security_data

def test_juniper_parser():
    config = """
system {
    host-name fw-juniper;
    services {
        ssh {
            protocol-version v2;
        }
        web-management {
            https {
                port 443;
            }
        }
    }
    syslog {
        user * {
            any emergency;
        }
    }
    ntp {
        server 10.0.0.1;
    }
}
snmp {
    v3;
}
    """
    detection = detect_vendor(config)
    assert detection["vendor"] == "juniper"

    parsed = parse_juniper_config(config)
    normalized = normalize_security_data(parsed)

    assert normalized["device"]["vendor"] == "juniper"
    assert normalized["device"]["hostname"] == "fw-juniper"
    assert normalized["security"]["ssh_enabled"] is True
    assert normalized["security"]["ssh_version"] == 2
    assert normalized["security"]["telnet_enabled"] is False
    assert normalized["security"]["https_enabled"] is True
    assert normalized["security"]["logging_enabled"] is True
    assert normalized["security"]["ntp_configured"] is True
    assert normalized["security"]["snmp_secure"] is True


def test_aruba_parser():
    config = """
hostname aruba-switch
!! Software Version FL.10.13.1000
ssh server vrf default
telnet-server disable
web-management https
logging 192.168.1.10
ntp server 192.168.1.20
snmp-server v3 enable
interface 1/1/1
    no shutdown
vlan 10
    """
    detection = detect_vendor(config)
    assert detection["vendor"] == "aruba"

    parsed = parse_aruba_config(config)
    normalized = normalize_security_data(parsed)

    assert normalized["device"]["vendor"] == "aruba"
    assert normalized["device"]["hostname"] == "aruba-switch"
    assert normalized["device"]["os_version"] == "FL.10.13.1000"
    assert normalized["security"]["ssh_enabled"] is True
    assert normalized["security"]["telnet_enabled"] is False
    assert normalized["security"]["https_enabled"] is True
    assert normalized["security"]["logging_enabled"] is True
    assert normalized["security"]["ntp_configured"] is True
    assert normalized["security"]["snmp_secure"] is True


def test_checkpoint_parser():
    config = """
set hostname cp-fw
# OS Version R81.10
set sshd enable
set web ssl-port 443
set syslog 10.0.0.1
set ntp server 10.0.0.2
set snmp usm user admin
set password-controls complexity yes
set clienv
add user admin
    """
    detection = detect_vendor(config)
    assert detection["vendor"] == "checkpoint"

    parsed = parse_checkpoint_config(config)
    normalized = normalize_security_data(parsed)

    assert normalized["device"]["vendor"] == "checkpoint"
    assert normalized["device"]["hostname"] == "cp-fw"
    assert normalized["security"]["ssh_enabled"] is True
    assert normalized["security"]["https_enabled"] is True
    assert normalized["security"]["logging_enabled"] is True
    assert normalized["security"]["ntp_configured"] is True
    assert normalized["security"]["snmp_secure"] is True
    assert normalized["security"]["password_policy"] == "configured"

