# SRMS REST API Specification

All endpoints are served under `/api` and return standardized JSON responses.

## Authentication Endpoints
- `POST /api/auth/login`
  - Body: `{ email: string, password: string }`
  - Sets `srms_session` cookie; returns `{ user: User, token: string }`
- `POST /api/auth/logout`
  - Clears `srms_session` cookie and revokes session.
- `GET /api/auth/me`
  - Returns current authenticated user and whether setup is needed (`{ user, needsSetup }`).
- `POST /api/auth/setup-admin`
  - One-time initial setup when 0 admins exist. Returns `{ user, token }`.
- `POST /api/auth/change-password`
  - Protected. Body: `{ currentPassword: string, newPassword: string }`.
- `PATCH /api/auth/profile`
  - Protected. Updates display profile details.

## Reports Endpoints
- `GET /api/reports`
  - Query parameters:
    - `search`: Case-insensitive text search on referenceId, title, summary, tags, author
    - `status`: Filter by `Draft`, `Submitted`, `Under Review`, `Approved`, `Rejected`, `Archived`, `All`
    - `category`: Filter by category name or ID
    - `priority`: `Low`, `Medium`, `High`, `Urgent`, `All`
    - `department`: Substring match on department
    - `dateFrom`, `dateTo`: Filter date range (YYYY-MM-DD)
    - `sort`: `reportingDate`, `createdAt`, `updatedAt`, `title`, `referenceId`
    - `order`: `asc`, `desc`
    - `page`, `limit`: Server-side pagination
  - Returns: `{ reports: Report[], total: number, page: number, totalPages: number }`
- `POST /api/reports`
  - Role: `ADMIN` or `STAFF`.
  - Body validated via Zod `ReportSchema`. Server generates unique sequential `referenceId`.
- `GET /api/reports/:id`
  - Returns full report record.
- `PATCH /api/reports/:id`
  - Optimistic concurrency check: validates `expectedVersion === current.version`. Increments version on update.
- `DELETE /api/reports/:id`
  - Permitted for Admin, or Staff for their own Draft reports.
- `POST /api/reports/:id/submit`
  - Submits draft report for administrative review.
- `POST /api/reports/:id/approve`
  - Role: `ADMIN`. Certifies report and updates status to `Approved`.
- `POST /api/reports/:id/reject`
  - Role: `ADMIN`. Returns report to author with required `reviewNotes`.
- `POST /api/reports/:id/archive`
  - Moves report to archive.
- `POST /api/reports/:id/restore`
  - Role: `ADMIN`. Restores archived report to `Draft`.
- `GET /api/reports/:id/export/pdf`
  - Generates standalone, printable HTML document with print stylesheets.
- `GET /api/reports/export/csv`
  - Downloads CSV containing filtered reports with formula injection protection.

## Dashboard Endpoints
- `GET /api/dashboard/stats`
  - Returns real calculated counts: total, draft, submitted, under review, approved, rejected, archived, this month, category distribution, status distribution, and 6-month volume trends.
- `GET /api/dashboard/activity`
  - Returns recent reports, notifications, and audit log items.

## Category Endpoints
- `GET /api/categories`
- `POST /api/categories` (Admin only)
- `PATCH /api/categories/:id` (Admin only)
- `DELETE /api/categories/:id` (Admin only)

## User Management Endpoints
- `GET /api/users` (Admin only)
- `POST /api/users` (Admin only)
- `GET /api/users/:id`
- `PATCH /api/users/:id` (Admin only)
- `DELETE /api/users/:id` (Admin only)

## Other Endpoints
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `POST /api/notifications/mark-all-read`
- `GET /api/audit-logs` (Admin only)
- `GET /api/settings`
- `PATCH /api/settings` (Admin only)
- `GET /api/health`
