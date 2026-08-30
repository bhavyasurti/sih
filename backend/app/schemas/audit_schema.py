from datetime import datetime
from typing import Optional

from app.schemas.common import BaseSchema


class DeviceCreate(BaseSchema):
    name: str
    vendor: str
    model: Optional[str] = None
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    status: str = "active"


class DeviceRead(DeviceCreate):
    id: int
    created_at: datetime
    updated_at: datetime


class AuditCreate(BaseSchema):
    device_id: Optional[int] = None
    title: str
    framework: str = "CIS"
    status: str = "pending"
    compliance_score: Optional[float] = None
    summary: Optional[str] = None


class AuditRead(AuditCreate):
    id: int
    created_at: datetime


class FindingCreate(BaseSchema):
    audit_id: int
    device_id: Optional[int] = None
    control_id: str
    title: str
    severity: str = "medium"
    status: str = "open"
    description: str = ""
    recommendation: Optional[str] = None


class FindingRead(FindingCreate):
    id: int
    created_at: datetime


class LearnedMappingCreate(BaseSchema):
    vendor: str
    raw_command: str
    normalized_control: str
    framework: str = "CIS"
    administrator: str = "system"


class LearnedMappingRead(LearnedMappingCreate):
    id: int
    created_at: datetime


class ReportCreate(BaseSchema):
    audit_id: int
    title: str
    file_name: str
    status: str = "generated"
    summary: Optional[str] = None


class ReportRead(ReportCreate):
    id: int
    generated_at: datetime
