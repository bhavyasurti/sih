from __future__ import annotations

import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def _safe_str(val: Any, default: str = "N/A") -> str:
    if val is None:
        return default
    s = str(val).strip()
    return s if s else default


def generate_compliance_pdf(
    audit_data: dict[str, Any],
    compliance_data: dict[str, Any],
    findings: list[dict[str, Any]],
) -> bytes:
    """Generate a clean, professional PDF compliance report using ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=2,
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#0891b2"),
        spaceAfter=10,
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "ReportBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )

    bold_body = ParagraphStyle(
        "BoldBody",
        parent=body_style,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0f172a"),
    )

    cli_style = ParagraphStyle(
        "CliCode",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#0f172a"),
    )

    badge_pass = ParagraphStyle(
        "BadgePass",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#059669"),
    )

    badge_fail = ParagraphStyle(
        "BadgeFail",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#dc2626"),
    )

    badge_unknown = ParagraphStyle(
        "BadgeUnknown",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#d97706"),
    )

    story: list[Any] = []

    # =========================================================================
    # Header Banner
    # =========================================================================
    story.append(Paragraph("NETSECURE AI", title_style))
    story.append(Paragraph("Security Compliance Report", subtitle_style))
    story.append(
        HRFlowable(
            width="100%",
            thickness=2,
            color=colors.HexColor("#06b6d4"),
            spaceBefore=0,
            spaceAfter=12,
        )
    )

    # =========================================================================
    # Audit Information
    # =========================================================================
    story.append(Paragraph("Audit Information", section_heading))

    audit_id = _safe_str(audit_data.get("id") or audit_data.get("audit_id"))
    created_at = audit_data.get("created_at")
    if isinstance(created_at, datetime):
        dt_str = created_at.strftime("%Y-%m-%d %H:%M:%S UTC")
    elif created_at:
        dt_str = str(created_at)
    else:
        dt_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    device_info = audit_data.get("device", {}) if isinstance(audit_data.get("device"), dict) else {}
    hostname = _safe_str(
        device_info.get("hostname")
        or audit_data.get("hostname")
        or audit_data.get("title")
    )
    vendor = _safe_str(
        device_info.get("vendor")
        or audit_data.get("vendor")
        or compliance_data.get("vendor")
    )
    model = _safe_str(device_info.get("model") or audit_data.get("model"))
    os_version = _safe_str(device_info.get("os_version") or audit_data.get("os_version"))
    framework = _safe_str(
        compliance_data.get("framework")
        or audit_data.get("framework")
        or "CIS"
    ).upper()

    audit_table_data = [
        [
            Paragraph("Audit ID:", bold_body),
            Paragraph(f"#{audit_id}", body_style),
            Paragraph("Date / Time:", bold_body),
            Paragraph(dt_str, body_style),
        ],
        [
            Paragraph("Device Hostname:", bold_body),
            Paragraph(hostname, body_style),
            Paragraph("Vendor:", bold_body),
            Paragraph(vendor, body_style),
        ],
        [
            Paragraph("Model:", bold_body),
            Paragraph(model, body_style),
            Paragraph("OS Version:", bold_body),
            Paragraph(os_version, body_style),
        ],
        [
            Paragraph("Framework:", bold_body),
            Paragraph(framework, body_style),
            Paragraph("Status:", bold_body),
            Paragraph(_safe_str(audit_data.get("status", "compliant")).capitalize(), body_style),
        ],
    ]

    audit_table = Table(audit_table_data, colWidths=[110, 160, 100, 170])
    audit_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    story.append(audit_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # Compliance Summary
    # =========================================================================
    story.append(Paragraph("Compliance Summary", section_heading))

    score = compliance_data.get("score")
    if score is None:
        score = audit_data.get("compliance_score", 0)
    try:
        score_val = int(round(float(score)))
    except (ValueError, TypeError):
        score_val = 0

    summary_info = compliance_data.get("summary") or {}
    total_eval = len(findings)
    passed_count = summary_info.get("passed", sum(1 for f in findings if f.get("status") == "PASS"))
    failed_count = summary_info.get("failed", sum(1 for f in findings if f.get("status") == "FAIL"))
    unknown_count = summary_info.get("unknown", sum(1 for f in findings if f.get("status") == "UNKNOWN"))
    overall_risk = compliance_data.get("overall_risk")
    if not overall_risk:
        failed_sevs = {str(f.get("severity", "")).upper() for f in findings if f.get("status") == "FAIL"}
        if "CRITICAL" in failed_sevs:
            overall_risk = "Critical"
        elif "HIGH" in failed_sevs:
            overall_risk = "High"
        elif "MEDIUM" in failed_sevs:
            overall_risk = "Medium"
        elif "LOW" in failed_sevs:
            overall_risk = "Low"
        elif unknown_count > 0:
            overall_risk = "Unknown"
        else:
            overall_risk = "Low"

    summary_table_data = [
        [
            Paragraph("Compliance Score", bold_body),
            Paragraph("Overall Risk", bold_body),
            Paragraph("Controls Evaluated", bold_body),
            Paragraph("Passed", bold_body),
            Paragraph("Failed", bold_body),
            Paragraph("Unknown", bold_body),
        ],
        [
            Paragraph(f"<font size=13 color='#0891b2'><b>{score_val}%</b></font>", styles["Normal"]),
            Paragraph(f"<font size=11 color='{'#dc2626' if overall_risk in ('Critical', 'High') else '#059669'}'><b>{overall_risk}</b></font>", styles["Normal"]),
            Paragraph(f"<font size=11><b>{total_eval}</b></font>", styles["Normal"]),
            Paragraph(f"<font size=11 color='#059669'><b>{passed_count}</b></font>", styles["Normal"]),
            Paragraph(f"<font size=11 color='#dc2626'><b>{failed_count}</b></font>", styles["Normal"]),
            Paragraph(f"<font size=11 color='#d97706'><b>{unknown_count}</b></font>", styles["Normal"]),
        ],
    ]

    summary_table = Table(summary_table_data, colWidths=[90, 90, 100, 85, 85, 90])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    for col_idx in range(6):
        summary_table_data[0][col_idx].style.textColor = colors.white
    story.append(summary_table)
    story.append(Spacer(1, 12))

    # =========================================================================
    # Detailed Findings & Remediation
    # =========================================================================
    story.append(Paragraph("Compliance Findings & Remediation", section_heading))

    if not findings:
        story.append(Paragraph("No compliance findings recorded for this audit.", body_style))
    else:
        for idx, finding in enumerate(findings, start=1):
            control_id = _safe_str(finding.get("control_id") or finding.get("control"))
            title = _safe_str(finding.get("title") or finding.get("control_name") or control_id)
            severity = _safe_str(finding.get("severity", "MEDIUM")).upper()
            status = _safe_str(finding.get("status", "UNKNOWN")).upper()
            finding_text = _safe_str(
                finding.get("finding")
                or finding.get("description")
                or finding.get("evidence")
            )
            current_state = _safe_str(finding.get("current_state") or finding.get("actual"))
            remediation_text = _safe_str(
                finding.get("remediation")
                or finding.get("remediation_command")
                or finding.get("recommendation")
                or "Manual remediation required"
            )

            status_para = (
                badge_pass
                if status == "PASS"
                else badge_fail
                if status == "FAIL"
                else badge_unknown
            )

            bg_card = colors.HexColor("#ffffff")
            header_bg = (
                colors.HexColor("#f0fdf4")
                if status == "PASS"
                else colors.HexColor("#fef2f2")
                if status == "FAIL"
                else colors.HexColor("#fffbeb")
            )

            # Finding Item Card Table
            finding_rows = [
                [
                    Paragraph(f"<b>#{idx}. {control_id} — {title}</b>", bold_body),
                    Paragraph(f"Severity: <b>{severity}</b>", bold_body),
                    Paragraph(f"Status: <b>{status}</b>", status_para),
                ],
                [
                    Paragraph("<b>Finding:</b>", body_style),
                    Paragraph(finding_text, body_style),
                    Paragraph("", body_style),
                ],
                [
                    Paragraph("<b>Current State:</b>", body_style),
                    Paragraph(current_state, body_style),
                    Paragraph("", body_style),
                ],
            ]

            if status != "PASS":
                # Formatted remediation CLI block
                formatted_cli = remediation_text.replace("\n", "<br/>")
                finding_rows.append(
                    [
                        Paragraph("<b>Remediation:</b>", body_style),
                        Paragraph(f"<font color='#047857'>{formatted_cli}</font>", cli_style),
                        Paragraph("", body_style),
                    ]
                )

            item_table = Table(
                finding_rows,
                colWidths=[100, 340, 100],
            )
            item_table.setStyle(
                TableStyle(
                    [
                        ("SPAN", (1, 1), (2, 1)),
                        ("SPAN", (1, 2), (2, 2)),
                        ("SPAN", (1, 3), (2, 3)) if len(finding_rows) > 3 else ("SPAN", (1, 2), (2, 2)),
                        ("BACKGROUND", (0, 0), (-1, 0), header_bg),
                        ("BACKGROUND", (0, 1), (-1, -1), bg_card),
                        ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#cbd5e1")),
                        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor("#cbd5e1")),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ]
                )
            )

            story.append(KeepTogether([item_table, Spacer(1, 6)]))

    # Build Document
    doc.build(story)
    return buffer.getvalue()
