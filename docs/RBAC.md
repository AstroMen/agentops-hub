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
