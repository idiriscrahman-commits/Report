# System Report Management System (SRMS)

A production-oriented full-stack web application and installable Progressive Web App (PWA) to create, save, review, approve, search, filter, print, and export general-purpose organizational reports.

## Features

- **Multi-Domain Reporting**: Suitable for Business, Daily Activity, Project, Technical, Incident, Research & Development, Academic, and custom taxonomies.
- **Role-Based Access Control (RBAC)**:
  - `ADMIN`: Full system governance, user management, category management, audit trail inspection, report approval/rejection.
  - `STAFF`: Draft creation, editing owned reports, submission for review, permitted exports.
  - `VIEWER`: Read-only access to authorized records, search, filter, and export.
- **Workflow & Concurrency**:
  - Full lifecycle: Draft &rarr; Submitted &rarr; Under Review &rarr; Approved / Rejected &rarr; Archived.
  - Optimistic Concurrency Control via document `version` to prevent silent overwrite of concurrent edits.
  - Auto-generated sequential reference IDs: `REP-[YEAR]-[SEQUENCE]` (e.g., `REP-2026-0001`).
- **Data Export & Printing**:
  - Clean printable document views with print media stylesheets.
  - Standalone PDF export endpoint.
  - CSV export with CWE-1236 formula injection protection (`=+@-` escaped).
- **Security & Integrity**:
  - Helmet security headers.
  - Rate-limited login endpoints.
  - Password hashing with bcrypt.
  - Tamper-evident administrative audit logs.
  - Zod validation on all client and server requests.
- **PWA & Mobile Compliance**:
  - Compliant web app manifest and high-resolution PNG icons (192px, 512px, maskable, apple-touch-icon).
  - In-app install banner with iOS Safari home-screen instructions.
  - Offline connectivity indicator.

---

## Seed Accounts for Testing

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@srms.org` | `AdminPass123!` | Dr. Evelyn Reed, Systems Director (Full privileges) |
| **STAFF** | `sarah.engineer@srms.org` | `StaffPass123!` | Sarah Chen, DevOps Architect (Authoring & submission) |
| **STAFF** | `marcus.vance@srms.org` | `StaffPass123!` | Marcus Vance, Security Lead (Authoring & submission) |
| **VIEWER** | `alex.auditor@srms.org` | `ViewerPass123!` | Alex Mercer, Regulatory Auditor (Read-only access) |

*You can also use the **Quick Persona Switcher** in the top navigation bar to switch between roles with a single click.*

---

## Local Installation & Quick Start (Windows 11 / macOS / Linux)

### Prerequisites
- Node.js (v20+ LTS or v22+)
- npm (v10+)
- (Optional) MongoDB Atlas account or local MongoDB instance

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(If no `MONGODB_URI` is provided, SRMS runs in persistent local mode stored in `.data/srms-db.json` with zero configuration needed).*

### Step 3: Run Unit Tests
```bash
npm run test
```

### Step 4: Start the Full-Stack Application
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Production Build
```bash
npm run build
npm run start
```
