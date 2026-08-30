from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    vendor: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hostname: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Audit(Base):
    __tablename__ = "audits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    device_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    framework: Mapped[str] = mapped_column(String(100), default="CIS")
    status: Mapped[str] = mapped_column(String(50), default="pending")
    compliance_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Finding(Base):
    __tablename__ = "findings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    audit_id: Mapped[int] = mapped_column(Integer, index=True)
    device_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    control_id: Mapped[str] = mapped_column(String(100), nullable=False)
    framework: Mapped[str] = mapped_column(String(50), default="CIS")
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    severity: Mapped[str] = mapped_column(String(50), default="medium")
    status: Mapped[str] = mapped_column(String(50), default="open")
    expected: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actual: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[str] = mapped_column(Text, default="")
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    remediation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class LearnedMapping(Base):
    __tablename__ = "learned_mappings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vendor: Mapped[str] = mapped_column(String(100), nullable=False)
    raw_command: Mapped[str] = mapped_column(String(500), nullable=False)
    command_pattern: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    normalized_control: Mapped[str] = mapped_column(String(150), nullable=False, default="")
    normalized_parameter: Mapped[str] = mapped_column(String(150), nullable=False, default="")
    value_type: Mapped[str] = mapped_column(String(50), nullable=False, default="string")
    description: Mapped[str] = mapped_column(Text, default="")
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    framework: Mapped[str] = mapped_column(String(50), default="CIS")
    administrator: Mapped[str] = mapped_column(String(255), default="system")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UnknownCommand(Base):
    __tablename__ = "unknown_commands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    audit_id: Mapped[int] = mapped_column(Integer, index=True)
    device_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    vendor: Mapped[str] = mapped_column(String(100), default="unknown")
    command: Mapped[str] = mapped_column(String(500), nullable=False)
    line_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    ai_suggestion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_by_mapping_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    audit_id: Mapped[int] = mapped_column(Integer, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(50), default="generated")
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
