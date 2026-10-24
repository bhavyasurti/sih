# NetSecure AI — Architecture Document

**Project:** SIH26155 — AI-Driven Multi-Vendor Network Security Compliance Auditor

This document outlines the architectural design and system flow of the NetSecure AI platform, reflecting the current production implementation.

---

## 1. High-Level System Architecture

NetSecure AI follows a decoupled, client-server architecture consisting of three primary tiers:

1. **Presentation Layer (Frontend):** A Single Page Application (SPA) built with React, TypeScript, and Vite.
2. **Application & Business Logic Layer (Backend):** A stateless RESTful API powered by Python and FastAPI.
3. **Data & AI Layer:** PostgreSQL for persistent storage and Google Gemini for Large Language Model (LLM) configuration analysis.

The system is deployed on Vercel, utilizing Vercel's edge network for static frontend hosting and Serverless Functions for the Python backend.

---

## 2. Component Details

### 2.1 Frontend Architecture
- **Framework:** React 18 with TypeScript.
- **Routing:** Client-side routing via `react-router-dom`, supporting protected routes.
- **State Management:** React Context API for authentication state and local component state for application flows.
- **Styling:** Tailwind CSS for a custom dark-themed enterprise UI, utilizing a bespoke design system with Lucide icons.
- **Visualization:** Integration with Three.js (via `@react-three/fiber`) for rendering 3D interactive network topology and security posture visualizations.
- **Authentication:** Firebase Authentication (Client SDK) handles user registration, login, and JWT token provisioning.

### 2.2 Backend Architecture
- **Framework:** FastAPI providing asynchronous, high-performance API endpoints.
- **Authentication/Security:** 
  - Validates Firebase JWT tokens on protected routes using the Firebase Admin SDK.
  - Implements a secure environment-based credential injection pattern to prevent secret leakage.
- **API Routing:**
  - `/api/auth`: Handles user synchronization between Firebase and the local database.
  - `/api/audits`: Manages the lifecycle of configuration audits (upload, analysis, listing).
  - `/api/training`: Exposes endpoints for the machine-teaching feedback loop.
- **AI Integration (Gemini):**
  - Uses the `google-genai` SDK to interface with Gemini models.
  - **Normalization Engine:** Instructs the LLM to parse proprietary network configuration syntax (Cisco, Juniper, Fortinet) into a vendor-agnostic JSON structure using deterministic system prompts and structured output requirements.
- **Compliance Engine:**
  - A deterministic, rules-based engine that evaluates the normalized JSON against predefined security frameworks (CIS, NIST).
  - Generates actionable remediation CLI commands tailored to the detected vendor OS.

### 2.3 Data Architecture
- **ORM:** SQLAlchemy 2.0 with asynchronous drivers.
- **Database:** PostgreSQL for production; SQLite support for local development.
- **Schema Design:**
  - `users`: Stores user identity mapped to Firebase UIDs.
  - `audits`: Tracks configuration audits, timestamps, status, and computed compliance scores.
  - `findings`: Stores individual compliance violations linked to audits, including severity, description, and remediation commands.
  - `learned_mappings`: Persists administrator-overridden rules and syntax translations to bypass the AI for known command structures, reducing latency and API costs.

---

## 3. Data Flow & Execution Pipeline

The core functionality of NetSecure AI revolves around the **Audit Pipeline**. The execution flow is as follows:

1. **Ingestion:** 
   - The user uploads a configuration file (e.g., `router.cfg`) via the React frontend.
   - The frontend transmits the payload to the backend `/api/audits/upload` endpoint.
2. **Pre-Processing:** 
   - The backend stores the raw configuration and initiates an asynchronous or synchronous analysis task.
3. **AI Normalization (Gemini):**
   - The configuration text is chunked and sent to the Gemini API with strict schema definitions.
   - The LLM extracts interfaces, ACLs, SNMP strings, routing protocols, and password hashes into a standardized JSON format.
4. **Deterministic Compliance Evaluation:**
   - The normalized JSON is evaluated locally by the Python backend against the selected framework (e.g., CIS).
   - Findings are generated for failing checks (e.g., "Password encryption not enabled").
5. **Remediation Generation:**
   - Vendor-specific remediation commands are attached to each finding based on the detected OS.
6. **Result Delivery:**
   - Findings, scores, and metadata are persisted to the database.
   - The frontend retrieves the results and renders them in the interactive dashboard and Results View.

---

## 4. Security & Deployment Posture

- **Deployment Platform:** Vercel (Production).
- **Environment Isolation:** Secrets (Database URLs, Gemini API keys, Firebase Private Keys) are managed strictly via environment variables. The codebase contains no hardcoded credentials.
- **Stateless Backend:** The FastAPI application is deployed as a Serverless Function, ensuring infinite horizontal scalability and zero idle cost.
- **Protected Endpoints:** All sensitive backend endpoints require a valid `Bearer` token (Firebase ID Token), verified against Google's public key infrastructure.
