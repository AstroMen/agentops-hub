# AgentOps Dashboard Framework v0.1

A reusable full-stack dashboard framework for ticket workflow management, run tracking, audit logging, and role-based access control.

## What is included

- **Dashboard API**: FastAPI + SQLAlchemy + Alembic.
- **Dashboard Web**: Next.js app router frontend.
- **Local infrastructure**: PostgreSQL via Docker Compose.
- **Developer scripts**: bootstrap, seed, and one-command local startup.

## Repository structure

- `apps/dashboard_api/` — backend service.
- `apps/dashboard_web/` — frontend service.
- `infra/docker-compose.yml` — local PostgreSQL.
- `scripts/` — development utilities.
- `docs/` — install and RBAC notes.

## Core business flow

### Tickets

- Tickets are created with metadata like `type`, `priority`, and `assigned_agent`.
- New tickets default to `PENDING_APPROVAL`.
- Admin users can approve/reject/queue tickets.
- `PUT /tickets/{id}` and `POST /tickets/{id}/update` support editing with permission checks.

### Runs

- Admin can start execution from queued tickets via `POST /runs/next`.
- Admin can finish runs via `POST /runs/{id}/finish` with status `DONE` or `FAILED`.
- Ticket status transitions follow lifecycle constraints (`QUEUED -> RUNNING -> DONE/FAILED`).

### Agents

- Agents are assignable executors for tickets.
- Agent CRUD endpoints are admin-only (`/agents`).
- Deletion is blocked if an agent is already referenced by tickets.

### Audit logs

- Key actions (ticket/agent/run operations) are written to audit logs.
- Audit listing endpoint (`GET /audit-logs`) is admin-only.

## Auth and permission model

- Backend authorization is the source of truth.
- API expects `Authorization: Bearer <token>`.
- `ADMIN_TOKEN` maps to Admin, `MEMBER_TOKEN` maps to Member.
- Frontend role-based UI is for UX only; backend still enforces `401/403`.

### Dev login in web UI

- Built-in credentials:
  - `admin / admin`
  - `member / member`
- Frontend stores:
  - `localStorage.dashboard_token`
  - `localStorage.dashboard_username`

### Token alignment note

If you change backend token values in `.env`, ensure frontend `NEXT_PUBLIC_*` token variables are aligned as well.

## Quickstart

### Option 1 (recommended): one command

```bash
./scripts/start_dev.sh
```

By default, this script:

1. Runs DB bootstrap (wait + migration + seed).
2. Ensures frontend dependencies are installed.
3. Starts API on `http://localhost:8000`.
4. Starts Web on `http://localhost:3000`.

### Option 2: manual startup

1. Start PostgreSQL:

```bash
docker compose -f infra/docker-compose.yml up -d
```

2. Prepare Python env:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

3. Bootstrap DB + migrations + seed:

```bash
./scripts/dev_bootstrap.sh
```

4. Start API:

```bash
cd apps/dashboard_api
PYTHONPATH=. uvicorn src.main:app --reload --port 8000
```

5. Start Web:

```bash
cd apps/dashboard_web
npm install
npm run dev
```

## Environment variables

From `.env.example`:

- `DATABASE_URL`
- `ADMIN_TOKEN`
- `MEMBER_TOKEN`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_ADMIN_TOKEN`

Frontend also supports `NEXT_PUBLIC_MEMBER_TOKEN` (defaults to `member-dev-token` when unset).

## API smoke checks

```bash
curl http://localhost:8000/health
curl -H "Authorization: Bearer member-dev-token" http://localhost:8000/tickets
curl -H "Authorization: Bearer admin-dev-token" http://localhost:8000/runs
curl -X POST -H "Authorization: Bearer admin-dev-token" http://localhost:8000/tickets/1/approve
```

## Tests

Run API tests locally:

```bash
PYTHONPATH=apps/dashboard_api pytest -q apps/dashboard_api/tests
```

## CI

CI workflow: `.github/workflows/ci.yml`

- `api-tests`: runs backend tests.
- `web-build`: runs frontend build check.

Triggers:

- Pull requests
- Push to `main`
- Manual dispatch

## Troubleshooting

### Restart with script

```bash
./scripts/start_dev.sh
```

### Detach mode

```bash
./scripts/start_dev.sh --detach
```

### Logs

```bash
tail -f /tmp/agentops_api.log
tail -f /tmp/agentops_web.log
```

### Common issues

- **401 Unauthorized**: verify token values and frontend/backend token alignment.
- **409 Conflict**: check whether status transition is valid.
- **DB connection failure**: verify PostgreSQL container is running (`docker ps`).

## Additional docs

- Chinese README: `README.zh-CN.md`
- Install guide: `docs/INSTALL.md`
- RBAC details: `docs/RBAC.md`
