from __future__ import annotations
from typing import Any, Dict

from pydantic import BaseModel, Field


class DeviceModel(BaseModel):
    hostname: str | None = None
    vendor: str | None = None
    model: str | None = None
    serial_number: str | None = None
    os_version: str | None = None


class SecurityModel(BaseModel):
    ssh_enabled: bool | None = None
    ssh_version: int | None = None
    telnet_enabled: bool | None = None
    http_enabled: bool | None = None
    https_enabled: bool | None = None
    logging_enabled: bool | None = None
    ntp_configured: bool | None = None
    snmp_secure: bool | None = None
    login_timeout: int | None = None
    password_policy: str | None = None


class NetworkModel(BaseModel):
    interfaces: list[dict[str, Any]] = Field(default_factory=list)
    acl_rules: list[str] = Field(default_factory=list)


class NormalizedAudit(BaseModel):
    device: DeviceModel
    security: SecurityModel
    network: NetworkModel
    unknown_commands: list[dict[str, Any]] = Field(default_factory=list)


def normalize_security_data(data: Dict[str, Any]) -> Dict[str, Any]:
    normalized = NormalizedAudit(
        device=data.get("device", {}),
        security=data.get("security", {}),
        network=data.get("network", {}),
        unknown_commands=data.get("unknown_commands", []),
    )
    return normalized.model_dump()
