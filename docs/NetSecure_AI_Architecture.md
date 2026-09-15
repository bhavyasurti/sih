# NETSECURE AI — SYSTEM ARCHITECTURE
### AI-Driven Multi-Vendor Network Security Compliance Auditor | SIH26155

## System Architecture

```mermaid
flowchart TD
    User([User])
    
    subgraph Frontend
        React[React / TypeScript \n Vite + Tailwind]
    end
    
    subgraph Auth
        Firebase[Firebase Auth]
    end
    
    subgraph Backend [FastAPI Backend]
        Audit[Audit Service]
        AISvc[AI Service]
        Report[Reporting]
        
        Parsers[Vendor Parsers]
        Norm[Vendor-Neutral\nNormalization]
        DetEngine[Deterministic\nCompliance Engine]
        
        CIS[CIS]
        NIST[NIST]
        
        Result[PASS / FAIL /\nUNKNOWN]
        Copilot[Gemini Copilot]
        HumanRev[Human Review &\nApproval]
        WorkingCfg[Working Configuration]
        ReAudit[Deterministic\nRe-Audit]
        Verified[VERIFIED RESULT]
    end
    
    subgraph External
        Gemini((Gemini API))
        ReportLab[ReportLab]
    end
    
    User --> React
    React --> Firebase
    Firebase --> Backend
    
    Backend --> Audit
    Backend --> AISvc
    Backend --> Report
    
    Audit --> Parsers
    AISvc --> Gemini
    Report --> ReportLab
    
    Parsers --> Norm
    Norm --> DetEngine
    DetEngine --> CIS
    DetEngine --> NIST
    CIS --> Result
    NIST --> Result
    
    Result --> Copilot
    Copilot --> HumanRev
    HumanRev --> WorkingCfg
    WorkingCfg --> ReAudit
    ReAudit --> Verified
```

## Component Description

### Frontend
React + TypeScript + Vite provides the responsive enterprise security interface.

### Backend
FastAPI handles authentication-aware APIs, auditing, compliance, remediation, AI orchestration and reporting.

### Parser Layer
Vendor-specific parsers convert heterogeneous network configurations into a normalized security representation.

### Compliance Engine
Deterministic rules evaluate implemented CIS and NIST controls.

### AI Layer
Gemini provides contextual explanation, remediation assistance and unknown-command analysis.

### Data Layer
SQLAlchemy with SQLite stores audits, findings, mappings and approval history.

### Authentication
Firebase Authentication provides user identity and backend token verification.

---
*(Page Break)*

# NETSECURE AI — DATA FLOW & SECURITY MODEL

## Data Flow

```mermaid
flowchart TD
    Cfg[Configuration File]
    InputVal[Input Validation]
    VenDet[Vendor Detection]
    VenPars[Vendor Parser]
    NormSec[Normalized Security Model]
    DetComp[Deterministic Compliance]
    PFU[PASS / FAIL / UNKNOWN]
    Rep[Report]
    GemRev[Gemini Review]
    StrucProp[Structured Proposal]
    HumApp[Human Approval]
    App[Approve]
    Ed[Edit]
    Rej[Reject]
    WrkCfg[Working Configuration]
    ReAud[Re-Audit]
    VerRes[Verified Result]
    
    Cfg --> InputVal
    InputVal --> VenDet
    VenDet --> VenPars
    VenPars --> NormSec
    NormSec --> DetComp
    DetComp --> PFU
    
    PFU -- PASS --> Rep
    PFU -- FAIL / UNKNOWN --> GemRev
    
    GemRev --> StrucProp
    StrucProp --> HumApp
    HumApp --> App
    HumApp --> Ed
    HumApp --> Rej
    
    App --> WrkCfg
    Ed --> WrkCfg
    WrkCfg --> ReAud
    ReAud --> VerRes
```

## Security Principles

* **Backend-only secrets**: Gemini API credentials and Firebase Admin credentials never enter the frontend bundle.
* **Authenticated APIs**: Sensitive backend operations require verified Firebase authentication.
* **Human-controlled remediation**: AI does not directly execute arbitrary network commands.
* **Deterministic authority**: Compliance decisions are based on deterministic rules where supported.
* **Structured AI output**: AI responses are validated before being used by application logic.
* **Re-audit verification**: Approved changes are re-evaluated rather than assuming that a proposed fix succeeded.
* **Safe learning**: Unknown-command mappings require administrator validation before becoming authoritative.

## Current Implementation

**Vendors**: Cisco IOS / IOS-XE, Fortinet FortiOS, Palo Alto PAN-OS, Juniper Junos, Aruba AOS-CX, Check Point Gaia  
**Deterministic Frameworks**: CIS, NIST SP 800-53  
**AI**: Google Gemini  
**Authentication**: Firebase Authentication  
**Reporting**: PDF / ReportLab  

## Future Extension
STIG / ISO 27001 control packs, Live device collection, Continuous compliance, Configuration drift detection, SIEM/SOAR integration, Controlled live remediation.
