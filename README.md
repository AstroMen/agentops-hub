# AgentOps Dashboard (v0.1)

A modular AgentOps dashboard framework with:
- RBAC (Admin/Member)
- Tickets + Approval workflow
- Runs center (execution history)
- Audit logs
- Pluggable business modules (e.g., quant)

> v0.1 Goal: Ship a working skeleton: **DB + API + Web UI + Tickets (approve/queue) + Runs**.

## Architecture (High-level)
- **apps/web**: Next.js UI (Ticket Board, Run Center, Strategy Catalog placeholder)
- **apps/api**: FastAPI backend (RBAC, tickets, runs, audit)
- **infra**: docker-compose + migrations + scripts
- **agents**: agent profiles (router, dashboard-dev, ...)
- **modules**: business modules (quant as a plugin)

Docs:
- `docs/INSTALL.md`
- `docs/ARCHITECTURE.md`
- `docs/RBAC.md`
- `docs/TASKS.md`
- `docs/AGENTS.md`
- `docs/MODULES.md`

## Quickstart (DB only for v0.1 bootstrap)

### Prereqs
- Docker + Docker Compose

### Start Postgres
```bash
docker compose -f infra/docker-compose.yml up -d
docker ps
```

Connection info (dev):
- Host: `localhost`
- Port: `5432`
- DB: `agentops`
- User: `agentops`
- Password: `agentops_dev_password`

Stop:
```bash
docker compose -f infra/docker-compose.yml down
```

## v0.1 Roadmap

### Core
- [ ] Postgres schema (users/roles/permissions, tickets, runs, audit_logs)
- [ ] FastAPI: auth + RBAC middleware
- [ ] Tickets API: create/list/approve/reject/queue
- [ ] Runs API: run-next + list
- [ ] Web UI: Ticket Board + Approve button + Run Center

### Security (v0.1)
- [ ] Member can create tickets (default `PENDING_APPROVAL`)
- [ ] Only Admin can approve + queue + execute
- [ ] Worker only consumes `QUEUED` tickets
- [ ] Audit log for approve/execute actions

## Contributing (early)
- Open an issue or create a ticket in the dashboard (once available).
- No secrets in repo. Use `.env` locally.

## License
Apache-2.0
