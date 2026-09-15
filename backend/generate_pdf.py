import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

def create_architecture_pdf(output_path):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter
    
    # Colors
    bg_color = HexColor("#0f172a") # dark slate
    brand_blue = HexColor("#3b82f6")
    brand_light = HexColor("#60a5fa")
    text_main = HexColor("#f8fafc")
    text_muted = HexColor("#94a3b8")
    card_bg = HexColor("#1e293b")
    card_border = HexColor("#334155")
    
    # PAGE 1 - SYSTEM ARCHITECTURE
    c.setFillColor(bg_color)
    c.rect(0, 0, width, height, fill=True, stroke=False)
    
    # Header
    c.setFillColor(text_main)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(40, height - 60, "NETSECURE AI")
    c.setFont("Helvetica", 14)
    c.setFillColor(brand_light)
    c.drawString(40, height - 85, "SYSTEM ARCHITECTURE")
    
    c.setFont("Helvetica", 10)
    c.setFillColor(text_muted)
    c.drawString(40, height - 105, "AI-Driven Multi-Vendor Network Security Compliance Auditor | SIH26155")
    
    # Helper to draw blocks
    def draw_block(x, y, w, h, title, subtitle="", fill=card_bg, stroke=card_border, text_c=text_main):
        c.setFillColor(fill)
        c.setStrokeColor(stroke)
        c.setLineWidth(1)
        c.roundRect(x, y-h, w, h, radius=4, fill=True, stroke=True)
        c.setFillColor(text_c)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(x + w/2, y - 20, title)
        if subtitle:
            c.setFont("Helvetica", 8)
            c.setFillColor(text_muted)
            c.drawCentredString(x + w/2, y - 35, subtitle)
            
    def draw_arrow(x1, y1, x2, y2):
        c.setStrokeColor(brand_light)
        c.setLineWidth(1.5)
        c.line(x1, y1, x2, y2)
        # simplistic arrowhead
        if y2 < y1 and x1 == x2: # pointing down
            c.line(x2, y2, x2-4, y2+6)
            c.line(x2, y2, x2+4, y2+6)
            
    # Draw Architecture Diagram (Page 1)
    center = width / 2
    
    # User
    draw_block(center - 60, height - 150, 120, 40, "USER", "Web Interface", brand_blue, brand_blue, text_main)
    draw_arrow(center, height - 190, center, height - 220)
    
    # Frontend
    draw_block(center - 90, height - 220, 180, 40, "FRONTEND", "React + TS + Vite")
    draw_arrow(center, height - 260, center, height - 290)
    
    # Auth
    draw_block(center - 220, height - 310, 120, 40, "AUTHENTICATION", "Firebase Auth")
    draw_arrow(center - 100, height - 330, center - 120, height - 330) # not real arrow, just connection
    c.setStrokeColor(brand_light)
    c.line(center - 100, height - 330, center - 60, height - 330)
    
    # Backend Shell
    c.setFillColor(HexColor("#020617"))
    c.setStrokeColor(brand_blue)
    c.setLineWidth(1.5)
    c.roundRect(center - 250, height - 680, 500, 360, radius=6, fill=True, stroke=True)
    c.setFillColor(brand_light)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(center - 240, height - 340, "FASTAPI BACKEND")
    
    # Backend Components
    draw_block(center - 75, height - 350, 150, 40, "API ROUTER", "FastAPI")
    draw_arrow(center, height - 390, center, height - 420)
    
    draw_block(center - 75, height - 420, 150, 40, "VENDOR PARSERS", "Regex & TextFSM")
    draw_arrow(center, height - 460, center, height - 490)
    
    draw_block(center - 90, height - 490, 180, 40, "DETERMINISTIC ENGINE", "CIS & NIST Controls")
    draw_arrow(center, height - 530, center, height - 560)
    
    draw_block(center - 90, height - 560, 180, 40, "COMPLIANCE RESULTS", "PASS / FAIL / UNKNOWN")
    
    # Side integrations
    draw_block(center + 110, height - 490, 120, 40, "GEMINI COPILOT", "AI Review")
    c.line(center + 90, height - 510, center + 110, height - 510)
    
    draw_block(center + 110, height - 560, 120, 40, "DATABASE", "SQLite / SQLAlchemy")
    c.line(center + 90, height - 580, center + 110, height - 580)
    
    draw_arrow(center, height - 600, center, height - 630)
    draw_block(center - 90, height - 630, 180, 40, "HUMAN APPROVAL", "Working Configuration Update")
    
    # Footer desc
    y_desc = height - 720
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(text_main)
    c.drawString(40, y_desc, "COMPONENT DESCRIPTION")
    
    desc_text = [
        ("Frontend", "React + TypeScript + Vite provides the responsive enterprise security interface."),
        ("Backend", "FastAPI handles authentication, auditing, compliance, AI orchestration and reporting."),
        ("Parser Layer", "Vendor-specific parsers convert heterogeneous configurations into a normalized model."),
        ("Compliance Engine", "Deterministic rules evaluate implemented CIS and NIST controls."),
        ("AI Layer", "Gemini provides contextual explanation, remediation and unknown-command analysis."),
        ("Authentication", "Firebase Authentication provides user identity and backend token verification.")
    ]
    
    y = y_desc - 25
    for title, txt in desc_text:
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(brand_light)
        c.drawString(40, y, title + ": ")
        c.setFont("Helvetica", 10)
        c.setFillColor(text_muted)
        c.drawString(130, y, txt)
        y -= 20
        
    c.showPage()
    
    # PAGE 2 - DATA FLOW & SECURITY
    c.setFillColor(bg_color)
    c.rect(0, 0, width, height, fill=True, stroke=False)
    
    c.setFillColor(text_main)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(40, height - 60, "DATA FLOW & SECURITY MODEL")
    
    # Data flow block diagram on left
    x_flow = 120
    y_flow = height - 120
    
    flow_steps = [
        "Configuration Upload",
        "Input Validation",
        "Vendor Parser",
        "Normalized Security Model",
        "Deterministic Compliance",
        "PASS / FAIL / UNKNOWN"
    ]
    
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(brand_light)
    c.drawString(40, y_flow + 20, "1. AUDIT FLOW")
    
    for i, step in enumerate(flow_steps):
        draw_block(x_flow - 80, y_flow, 160, 30, step)
        if i < len(flow_steps) - 1:
            draw_arrow(x_flow, y_flow - 30, x_flow, y_flow - 50)
        y_flow -= 50
        
    # Split flow
    draw_arrow(x_flow, y_flow, x_flow - 60, y_flow - 30)
    draw_arrow(x_flow, y_flow, x_flow + 60, y_flow - 30)
    
    draw_block(x_flow - 110, y_flow - 30, 100, 30, "PASS -> Report")
    draw_block(x_flow + 10, y_flow - 30, 100, 30, "FAIL / UNKNOWN")
    
    draw_arrow(x_flow + 60, y_flow - 60, x_flow + 60, y_flow - 80)
    draw_block(x_flow + 10, y_flow - 80, 100, 30, "Gemini Review", fill=brand_blue)
    
    draw_arrow(x_flow + 60, y_flow - 110, x_flow + 60, y_flow - 130)
    draw_block(x_flow + 10, y_flow - 130, 100, 30, "Human Approval")
    
    draw_arrow(x_flow + 60, y_flow - 160, x_flow + 60, y_flow - 180)
    draw_block(x_flow + 10, y_flow - 180, 100, 30, "Working Config")
    
    draw_arrow(x_flow + 60, y_flow - 210, x_flow + 60, y_flow - 230)
    draw_block(x_flow + 10, y_flow - 230, 100, 30, "Re-Audit (Verified)")
    
    # Security Principles on right
    x_sec = 320
    y_sec = height - 100
    
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(brand_light)
    c.drawString(x_sec, y_sec, "2. SECURITY PRINCIPLES")
    
    sec_principles = [
        ("Backend-only secrets", "Gemini & Firebase Admin keys never enter frontend."),
        ("Authenticated APIs", "Sensitive operations require Firebase auth tokens."),
        ("Human-controlled", "AI does not directly execute arbitrary network commands."),
        ("Deterministic authority", "Compliance decisions are based on strict rules."),
        ("Structured AI output", "AI responses are validated via strict schemas."),
        ("Re-audit verification", "Approved changes are deterministically re-evaluated.")
    ]
    
    y_sec -= 30
    for title, txt in sec_principles:
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(text_main)
        c.drawString(x_sec, y_sec, title)
        c.setFont("Helvetica", 9)
        c.setFillColor(text_muted)
        c.drawString(x_sec, y_sec - 15, txt)
        y_sec -= 35
        
    y_sec -= 20
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(brand_light)
    c.drawString(x_sec, y_sec, "3. CURRENT IMPLEMENTATION")
    y_sec -= 25
    c.setFont("Helvetica", 9)
    c.setFillColor(text_muted)
    c.drawString(x_sec, y_sec, "Vendors: Cisco IOS, Fortinet, PAN-OS, Junos, Aruba, Check Point")
    c.drawString(x_sec, y_sec - 15, "Frameworks: CIS, NIST SP 800-53")
    c.drawString(x_sec, y_sec - 30, "AI: Google Gemini")
    c.drawString(x_sec, y_sec - 45, "Authentication: Firebase")
    
    y_sec -= 75
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(brand_light)
    c.drawString(x_sec, y_sec, "4. FUTURE EXTENSION")
    y_sec -= 25
    c.setFont("Helvetica", 9)
    c.setFillColor(text_muted)
    c.drawString(x_sec, y_sec, "STIG & ISO 27001 packs, Live device collection,")
    c.drawString(x_sec, y_sec - 15, "Continuous compliance, Configuration drift detection,")
    c.drawString(x_sec, y_sec - 30, "SIEM integration, Controlled live remediation.")
    
    c.save()
    print("PDF generated successfully.")

if __name__ == "__main__":
    create_architecture_pdf("d:/SIH26155-NetSecureAI/docs/NetSecure_AI_Architecture.pdf")
