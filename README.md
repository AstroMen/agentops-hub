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

2. Install API dependencies and setup env
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


## CI (GitHub Actions)

A concise CI pipeline is provided at `.github/workflows/ci.yml`:
- **api-tests**: installs Python dependencies and runs API smoke tests (`pytest`).
- **web-build**: installs Node dependencies and runs `next build` to verify web service health.

Trigger strategy:
- `pull_request`: run checks before merge.
- `push` to `main`: run checks after each merge.
- `workflow_dispatch`: allow manual reruns when needed.

Reliability tweaks:
- **concurrency cancellation**: automatically cancels outdated runs on the same ref.
- **timeout guards**: each job has a 10-minute timeout.

Run API tests locally:
```bash
PYTHONPATH=apps/dashboard_api pytest -q apps/dashboard_api/tests
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

<img width="1274" height="827" alt="image" src="https://github.com/user-attachments/assets/b4dba5dd-99df-4064-86fb-cc665564eb4a" />

## 权限与 Token 业务逻辑（Dashboard Web + API）

### 1) 后端鉴权是唯一权限来源
- API 只认 `Authorization: Bearer <token>`。
- `ADMIN_TOKEN` 映射为 Admin，`MEMBER_TOKEN` 映射为 Member。
- 前端页面上的「是否可操作」仅用于 UX 提示；真正权限由后端 `401/403` 决定。

### 2) 前端登录与本地状态
- 登录页内置两组开发账号：`admin/admin` 与 `member/member`。
- 登录成功后，前端会把 token 和 username 写入 `localStorage`：
  - `dashboard_token`
  - `dashboard_username`
- 页面判断是否 Admin 时，优先使用 `dashboard_username`（避免仅靠 token 字符串比较带来的误判）；如果 username 缺失，再回退到 token 对比。

### 3) `NEXT_PUBLIC_MEMBER_TOKEN` 的配置要点
- `NEXT_PUBLIC_*` 变量会暴露到浏览器，只应放开发/演示 token。
- 若后端改了 `MEMBER_TOKEN`，前端也必须同步 `NEXT_PUBLIC_MEMBER_TOKEN`，否则 member 登录会拿到错误 token 并返回 `401 Invalid token`。
- 默认开发值：
  - Admin: `admin-dev-token`
  - Member: `member-dev-token`

### 4) 推荐的本地联调检查
```bash
curl -H "Authorization: Bearer ${ADMIN_TOKEN:-admin-dev-token}" http://localhost:8000/tickets
curl -H "Authorization: Bearer ${MEMBER_TOKEN:-member-dev-token}" http://localhost:8000/tickets
```

## INSTALL / RBAC docs
- 详细安装：`docs/INSTALL.md`
- 权限说明：`docs/RBAC.md`

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
