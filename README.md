# AgentOps Dashboard Framework v0.1

A reusable dashboard framework for:
- Ticket workflow visibility
- Agent run/artifact tracking
- Approval gate + audit logs
- RBAC (Admin/Member)

## Repository structure
- `apps/dashboard_api/`: FastAPI + SQLAlchemy + Alembic
- `apps/dashboard_web/`: Next.js dashboard UI
- `infra/docker-compose.yml`: Postgres for local development

## Business Logic Overview

### Tickets
- Tickets are created with metadata (`type`, `priority`, `assigned_agent`) and enter `PENDING_APPROVAL` by default.
- Members and Admins can list tickets; Admins can operate full lifecycle transitions (`approve/reject/queue`).
- Editing rules are permission-aware (`PUT /tickets/{id}` and `POST /tickets/{id}/update`) and validated by the backend.

### Runs
- Runs are admin-driven execution records.
- Admin can start next run (`POST /runs/next`) and finish a run (`POST /runs/{id}/finish`).
- Status transitions are constrained to valid lifecycle paths; invalid transitions return `409`.

### Agents
- Agents are managed as available executors for ticket assignment.
- Agent CRUD (`/agents`) is admin-only at API layer.
- Web UI mirrors this by showing management actions only for admin role, while backend still enforces final authorization.

### Auth, Permissions, and Token flow (Dashboard Web + API)
1. **Backend authorization is the source of truth**
   - API only trusts `Authorization: Bearer <token>`.
   - `ADMIN_TOKEN` maps to Admin; `MEMBER_TOKEN` maps to Member.
   - Frontend permission UI is only UX gating. Final enforcement comes from backend `401/403`.

2. **Frontend login and local state**
   - Built-in dev credentials: `admin/admin` and `member/member`.
   - On login, frontend stores:
     - `localStorage.dashboard_token`
     - `localStorage.dashboard_username`
   - UI role checks prefer username first, then fallback to token comparison.

3. **`NEXT_PUBLIC_MEMBER_TOKEN` alignment matters**
   - `NEXT_PUBLIC_*` variables are exposed to browser and should only hold dev/demo tokens.
   - If backend `MEMBER_TOKEN` changes, frontend `NEXT_PUBLIC_MEMBER_TOKEN` must be updated too.
   - Otherwise member login may receive `401 Invalid token`.

4. **Local verification examples**
```bash
curl -H "Authorization: Bearer ${ADMIN_TOKEN:-admin-dev-token}" http://localhost:8000/tickets
curl -H "Authorization: Bearer ${MEMBER_TOKEN:-member-dev-token}" http://localhost:8000/tickets
```

## Quickstart

### Option 1: Use start script (recommended)
```bash
# Start both API and Web services
./scripts/start_dev.sh
```

Services:
- API: http://localhost:8000
- Web: http://localhost:3000

### Option 2: Manual start

1. Start database
```bash
docker compose -f infra/docker-compose.yml up -d
```

2. Install API dependencies and setup env
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

3. Run migrations + RBAC seed
```bash
cd apps/dashboard_api
PYTHONPATH=. alembic upgrade head
PYTHONPATH=. python -m src.seed
```

4. Start API
```bash
cd apps/dashboard_api
PYTHONPATH=. uvicorn src.main:app --reload --port 8000
```

5. Start Web
```bash
cd apps/dashboard_web
npm install
npm run dev
```

## Chinese README
- 中文说明请查看：`README.zh-CN.md`

## INSTALL / RBAC docs
- Detailed install: `docs/INSTALL.md`
- RBAC details: `docs/RBAC.md`

## API checks
```bash
curl http://localhost:8000/health
curl -H "Authorization: Bearer member-dev-token" http://localhost:8000/tickets
curl -X POST -H "Authorization: Bearer admin-dev-token" http://localhost:8000/tickets/1/approve
```

## Troubleshooting

### Restart services
```bash
./scripts/start_dev.sh
```

### Manual restart
```bash
# Stop existing processes
pkill -f "uvicorn src.main:app" && pkill -f "next dev"

# Start again
cd apps/dashboard_api && python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
cd apps/dashboard_web && npm run dev &
```

### View API logs
```bash
tail -f /tmp/api.log
```

### View Web logs
```bash
tail -f /tmp/web.log
```

### Common issues
- **404 Not Found**: restart API and ensure routes are loaded.
- **401 Unauthorized**: verify token values (`admin-dev-token` / `member-dev-token`).
- **Database connection failed**: verify PostgreSQL container is running (`docker ps`).
