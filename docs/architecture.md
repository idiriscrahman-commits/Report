# System Report Management System (SRMS) - Architecture

## 1. System Overview
SRMS is a production-oriented, full-stack enterprise web application and Progressive Web App (PWA) built for creating, managing, approving, searching, and exporting organizational reports across diverse industry domains (technical post-mortems, daily operational logs, academic research, incident reports, financial reviews, and custom taxonomies).

```
                      +-----------------------------+
                      |   Client: React 19 + PWA    |
                      | (Tailwind v4, Lucide Icons) |
                      +--------------+--------------+
                                     |
                       HTTPS REST / JSON API (Port 3000)
                                     |
                      +--------------v--------------+
                      |   Express.js API Server     |
                      |  - Helmet Security Headers  |
                      |  - Role-Based Access (RBAC) |
                      |  - Rate Limiting            |
                      |  - Zod Request Validators   |
                      |  - Tamper-Evident Audit Log |
                      +--------------+--------------+
                                     |
                 +-------------------+-------------------+
                 |                                       |
    [If MONGODB_URI provided]            [Local Dev / Offline Fallback]
                 |                                       |
  +--------------v--------------+         +--------------v--------------+
  |    MongoDB Atlas Cluster    |         |   Persistent Local Store    |
  |     - Mongoose Schemas      |         |   (.data/srms-db.json)      |
  |     - Text & Compound Index |         |   - In-memory index cache   |
  |     - Unique Constraints    |         |   - Deterministic seed data |
  +-----------------------------+         +-----------------------------+
```

## 2. Authentication & Authorization Architecture
- **Authentication**: Stateful secure cookie (`srms_session`) with HTTP-Only, SameSite, and 7-day expiration. Also accepts `Authorization: Bearer <token>` for API integrations.
- **Password Security**: Passwords hashed using `bcrypt` (10 salt rounds).
- **First-Admin Initialization**: `POST /api/auth/setup-admin` is only allowed when exactly 0 active admin accounts exist in the database. Once created, the endpoint permanently returns HTTP 403 Forbidden.
- **RBAC Matrix**:
  - `ADMIN`: Full administrative control across users, taxonomies, settings, audit logs, and approval/rejection/archival of any report.
  - `STAFF`: Create reports, edit owned reports (Draft or Rejected), submit reports for review, and export permitted reports.
  - `VIEWER`: Read-only access to approved, internal, or public reports; search and filter records; permitted exports.

## 3. Concurrency & Data Integrity
- **Optimistic Concurrency Control**: Reports maintain an integer `version` field. When updating, clients send their known version. If another user edited concurrently, the server rejects the update with `HTTP 409 Conflict`.
- **Reference ID Sequences**: Deterministic pattern `[PREFIX]-[YEAR]-[SEQUENCE]` (e.g. `REP-2026-0042`) generated atomically on the server.
- **CWE-1236 Prevention**: All CSV exports sanitize formula injection vectors (`=`, `+`, `-`, `@`, `\t`, `\r`, `|`) by prepending a single quote `'` and escaping quotes.
