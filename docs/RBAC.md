# RBAC (v0.1)

## Roles
- **Member**
  - `ticket:create`
  - `ticket:read`
- **Admin**
  - all Member permissions
  - `ticket:approve`
  - `ticket:queue`
  - `ticket:execute`
  - `audit:read`
  - `admin:manage_users`

## Auth model (dev)
- Bearer token from `.env`.
- `ADMIN_TOKEN` => Admin.
- `MEMBER_TOKEN` => Member.

## Endpoint constraints
- Member/Admin
  - `POST /tickets`
  - `GET /tickets`
  - `GET /tickets/{id}`
  - `PUT /tickets/{id}` (Admin can edit any ticket; Member can only edit their own `PENDING_APPROVAL` tickets)
  - `POST /tickets/{id}/update` (same permission rules as `PUT`, for environments that only allow GET/POST)
- Admin only
  - `POST /tickets/{id}/approve`
  - `POST /tickets/{id}/reject`
  - `POST /tickets/{id}/queue`
  - `POST /runs/next`
  - `POST /runs/{id}/finish`
  - `GET /runs`
  - `GET /audit-logs`

## Expected failures
- Missing/invalid token -> `401`.
- Non-admin to admin endpoint -> `403`.
- Illegal status transition -> `409`.

## User stories: Current Token and User Business Logic

### Story 1: As a regular member, I want to submit and view tickets using only a Member token
- **Given** I include `Authorization: Bearer member-dev-token` in the request header.
- **When** I call `POST /tickets` or `GET /tickets` / `GET /tickets/{id}`.
- **Then** the system identifies me as a Member and allows ticket creation and viewing.
- **And** newly created tickets default to `PENDING_APPROVAL` and an audit log is recorded.

### Story 2: As a regular member, I should not be able to perform admin actions
- **Given** I am using a Member token.
- **When** I try to call Admin-only endpoints such as `POST /tickets/{id}/approve`, `POST /tickets/{id}/queue`, or `GET /runs`.
- **Then** the system returns `403 Admin role required` and rejects the operation.

### Story 3: As an admin, I want to complete approval and queue actions with an Admin token
- **Given** I include `Authorization: Bearer admin-dev-token` in the request header.
- **When** I call `approve` or `reject` on a `PENDING_APPROVAL` ticket.
- **Then** the ticket transitions to `APPROVED` / `REJECTED` according to the rules and an audit log is written.
- **And** only `APPROVED` tickets can be queued into `QUEUED`.

### Story 4: As an admin, I want to drive the run lifecycle
- **Given** I am using an Admin token.
- **When** I call `POST /runs/next` to start execution, or `POST /runs/{id}/finish` to finish execution.
- **Then** only valid transitions (for example `QUEUED -> RUNNING -> DONE/FAILED`) succeed.
- **And** invalid transitions return `409` while preserving data consistency.

### Story 5: As a frontend user, I want the token to determine what operations are available in the UI
- **Given** I paste a token into the frontend input (saved as `localStorage.dashboard_token`).
- **When** the frontend sends API requests, it automatically includes `Bearer token`.
- **Then** with a Member token I can browse and create tickets; with an Admin token the UI additionally shows approve/queue actions.
- **And** if the token is missing or invalid, the backend returns `401` and the frontend shows an error.

### Story 6: As a system maintainer, I want tokens to map to persistent user entities
- **Given** the backend receives a valid Admin/Member token.
- **When** authentication logic runs.
- **Then** the system maps the token to a fixed email (`admin@local` / `member@local`) and auto-creates the user if it does not exist.
- **And** subsequent business and audit records are persisted using that user ID.
