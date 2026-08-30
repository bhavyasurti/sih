from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class DeviceSchema(BaseModel):
    hostname: str | None = None
    vendor: str | None = None
    model: str | None = None
    serial_number: str | None = None
    os_version: str | None = None


class SecuritySchema(BaseModel):
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


class NetworkSchema(BaseModel):
    interfaces: list[dict[str, Any]] = Field(default_factory=list)
    acl_rules: list[str] = Field(default_factory=list)


class NormalizedAuditSchema(BaseModel):
    device: DeviceSchema = Field(default_factory=DeviceSchema)
    security: SecuritySchema = Field(default_factory=SecuritySchema)
    network: NetworkSchema = Field(default_factory=NetworkSchema)
    unknown_commands: list[dict[str, Any]] = Field(default_factory=list)


class AIInterpretationSchema(BaseModel):
    parameter: str
    value: Any
    confidence: float
    reasoning_summary: str
