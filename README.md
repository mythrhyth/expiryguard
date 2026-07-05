# ExpiryGuard: Enterprise Record Expiry & Compliance Management System

ExpiryGuard is a premium, full-stack compliance and contract renewal management system designed to eliminate manual data entry using AI Document Intelligence. It is built as a production-grade corporate solution for managing agreements, insurance policies, licenses, and certificates.

---

## Technical Stack

*   **Frontend**: React, TypeScript, Tailwind CSS, Recharts (data visualizations), Lucide Icons, Axios (API Client).
*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite database, Winston (Winston Winston Logger).
*   **AI Engine**: Google Gemini API (with high-fidelity heuristic fallback for offline testing).
*   **Document Processing**: PDFKit (landscape report rendering) and ExcelJS (styled spreadsheet exporter).

---

## Core Features

1.  **AI Document Intelligence & Pre-filling**:
    *   **Drag & Drop Zone**: Upload PDF or image contracts directly on the record creation modal.
    *   **Breathing Loader Steps**: A multi-step visual sequence animations (*Analyzing document...*, *Extracting information...*, etc.) while the AI parses fields.
    *   **Confidence Highlights**: Automatically outlines fields in **orange** with verification badges if AI extraction confidence is under 70%.
    *   **AI Summary Box & Alerts**: Generates a brief summary of the contract bounds and flags potential duplicate records based on document numbers or matching vendors.
2.  **Dashboard Analytics**:
    *   Dynamic KPI summary metrics.
    *   Upcoming renewals and expirations bar charts.
    *   Sector diagrams for category distributions.
    *   Live warning alerts feed and audit activity logs.
3.  **Expiry Calendar**:
    *   Interactive calendar populating record expiry milestones.
    *   Color-coded urgency alerts (Critical: 0-7 days, Expiring: 8-30 days, Active: 30+ days).
4.  **Reports & Export Modules**:
    *   Download customized, brand-colored spreadsheets (`Excel`).
    *   Download landscape compliance matrices (`PDF`).
    *   Standard `CSV` datasets.
5.  **Role-Based Security & JWT Auth**:
    *   Dynamic roles: `ADMIN`, `MANAGER`, `VIEWER`.
    *   Silent refresh-token interceptor restoring expired sessions.
    *   Admin-only dynamic role modification (`PUT /api/auth/users/:id/role`).

---

## Local Setup Instructions

Ensure you have [Node.js (v20+)](https://nodejs.org) installed on your system.

### 1. Initialize Configuration
Copy `.env.example` to `.env` at the root level and inside the `/backend` directory:
```bash
cp .env.example .env
cp .env.example backend/.env
```

To enable real AI parsing, add your Gemini API Key in the `.env` files:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(If no key is configured, the system will use the filename heuristic parser to test the pre-fill flow seamlessly).*

### 2. Setup the Database
Install dependencies and sync the database schema locally using Prisma:
```bash
# Go to backend directory
cd backend
npm install

# Initialize SQLite database and tables
npx prisma db push --accept-data-loss

# Seed corporate compliance data
npx prisma db seed
```

### 3. Run the Servers

#### Terminal 1: Start the Backend (API port: 5000)
```bash
cd backend
npm run dev
```

#### Terminal 2: Start the Frontend (Vite port: 5173)
```bash
# Open a new terminal in the project root
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Dev Accounts & Credentials

You can sign in or register new viewer accounts. The database is pre-seeded with the following accounts:

| User | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Rohan Mehta** | `rohan@tatasteel.com` | `Password123!` | Administrator |
| **Priya Sharma** | `priya@tatasteel.com` | `Password123!` | Manager |
| **Amit Patel** | `amit@tatasteel.com` | `Password123!` | Viewer |