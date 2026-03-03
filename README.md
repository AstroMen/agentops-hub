# AgentOps Dashboard Framework v0.1

A reusable dashboard framework that includes:
- Ticket module progress visualization
- Agent runs and artifacts display
- Approval gates with audit logs
- RBAC (Admin/Member)

## Repository structure
- `apps/dashboard_api/`: FastAPI + SQLAlchemy + Alembic
- `apps/dashboard_web/`: Minimal dashboard UI built with Next.js
- `infra/docker-compose.yml`: Postgres development environment

## Quickstart

### Option 1: Use start script (recommended)
```bash
# One command starts DB bootstrap + API + Web
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

2. Install API dependencies and configure environment
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

3. Run bootstrap (DB wait + migrations + seed)
```bash
./scripts/dev_bootstrap.sh
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

<img width="1274" height="827" alt="image" src="https://github.com/user-attachments/assets/b4dba5dd-99df-4064-86fb-cc665564eb4a" />

## Installation and RBAC docs
- Detailed setup: `docs/INSTALL.md`
- Permission guide: `docs/RBAC.md`
- Chinese README: `README.zh-CN.md`

## API checks
```bash
curl http://localhost:8000/health
curl -H "Authorization: Bearer member-dev-token" http://localhost:8000/tickets
curl -X POST -H "Authorization: Bearer admin-dev-token" http://localhost:8000/tickets/1/approve
```

## Troubleshooting

### Restart services
The script handles DB bootstrap and starts API/Web in one command. Use it to restart local dev stack:
```bash
./scripts/start_dev.sh
```

### Restart services manually
```bash
# Stop existing processes
pkill -f "uvicorn src.main:app" && pkill -f "next dev"

# Start services
cd apps/dashboard_api && python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
cd apps/dashboard_web && npm run dev &
```

### View API logs
```bash
# Check log file
tail -f /tmp/agentops_api.log

# Or use the process tool
process action=list
process action=log sessionId=<session-id>
```

### View Web logs
```bash
tail -f /tmp/agentops_web.log
```

### Common issues
- **404 Not Found**: Check whether API has restarted and whether new routes are loaded (run `./scripts/start_dev.sh` to restart).
- **401 Unauthorized**: Check whether the token is correct (default: `admin-dev-token` / `member-dev-token`).
- **Database connection failed**: Confirm PostgreSQL container is running with `docker ps`.
