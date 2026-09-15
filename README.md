# NetSecure AI — AI-Driven Multi-Vendor Network Security Compliance Auditor

**Problem Statement:** SIH26155
**Theme:** Cyber Security
**Domain:** Configuration Auditing & Compliance

## 1. NetSecure AI

NetSecure AI is an intelligent, multi-vendor network security compliance auditor. Network administrators frequently struggle with managing security compliance across heterogeneous network environments featuring devices from Cisco, Juniper, Fortinet, and others. Misconfigurations and non-compliant security postures often lead to vulnerabilities and costly data breaches.

NetSecure AI solves this by automatically ingesting router/firewall configuration files, normalizing their syntax using Generative AI (Gemini), and evaluating them against industry-standard compliance frameworks such as CIS (Center for Internet Security) and NIST.

## 2. Solution Overview

NetSecure AI provides a unified platform to enforce security compliance without requiring security teams to memorize proprietary vendor CLI syntax. 

### Key Features
- **Multi-Vendor Configuration Support:** Automatically detects and audits configurations for Cisco IOS, Juniper Junos, Fortinet, and generic network devices.
- **AI-Powered Normalization Engine:** Leverages the Gemini API to intelligently translate proprietary vendor CLI commands into standard, vendor-agnostic security primitives.
- **Automated Compliance Auditing:** Evaluates the normalized configuration against CIS and NIST frameworks to detect security flaws (e.g., weak passwords, open telnet, missing ACLs).
- **Interactive Security Dashboard:** A React-based Single Page Application (SPA) providing a dark-themed, enterprise-grade interface to visualize compliance scores, risk topology, and remediation steps.
- **Remediation Generation:** Provides exact CLI commands to fix identified vulnerabilities tailored to the specific device OS.
- **Machine-Teaching Feedback Loop:** Administrators can override AI classifications. The system learns from these overrides, allowing deterministic rule-matching for future audits.

## 3. Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide React (Icons), Three.js (3D Topology)
- **Backend:** Python, FastAPI, SQLAlchemy, Pydantic
- **Database:** PostgreSQL (Supabase/Neon), SQLite (Local Fallback)
- **AI/ML:** Google Gemini (google-genai SDK) for Large Language Model processing
- **Authentication:** Firebase Authentication
- **Deployment:** Vercel (Frontend & Serverless Backend)

## 4. Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- PostgreSQL Database (or local SQLite)
- Firebase Project (for Authentication)
- Google Gemini API Key

### Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-org/SIH26155-NetSecureAI.git
   cd SIH26155-NetSecureAI
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   
   # Set environment variables (see .env.example)
   # GEMINI_API_KEY, DATABASE_URL, FIREBASE credentials
   
   # Run the FastAPI server
   uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Set frontend environment variables (see .env.example)
   # VITE_FIREBASE_API_KEY, VITE_API_BASE_URL, etc.
   
   # Run the Vite development server
   npm run dev
   ```

4. **Access the Application**
   Open your browser and navigate to `http://localhost:5173`.

## 5. Security & Privacy Note

This repository does **not** contain any hardcoded secrets, API keys, or Firebase service-account JSON files. All sensitive configurations are injected dynamically via environment variables in accordance with enterprise security best practices.

---
*Built for the Smart India Hackathon (SIH).*
