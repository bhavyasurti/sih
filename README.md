# NetSecure AI

AI-Driven Multi-Vendor Network Security Compliance Auditor.

## Project Overview

This project is an MVP foundation for a multi-vendor compliance auditing platform for Cisco IOS, Fortinet FortiOS, and Palo Alto PAN-OS. The system currently provides a working full-stack foundation with a FastAPI backend, SQLite database, and React + Vite frontend shell.

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: FastAPI + SQLAlchemy + SQLite
- Data: SQLite
- UI libraries: Lucide React, Recharts

## Backend setup

1. Open a terminal in the project root.
2. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Start the API:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
4. Health check:
   ```bash
   curl http://localhost:8000/api/health
   ```

## Frontend setup

1. Open a terminal in the project root.
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Start the app:
   ```bash
   npm run dev -- --host 0.0.0.0
   ```
4. Open the Vite app in the browser.

## Environment files

- Backend example environment: [backend/.env.example](backend/.env.example)

## Notes

- The current phase is foundation-only.
- Parsing, AI normalization, compliance logic, remediation, and PDF generation are intentionally not implemented yet.
