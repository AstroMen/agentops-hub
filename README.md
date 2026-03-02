# AgentOps Dashboard Framework v0.1

可复用的 Dashboard Framework，覆盖：
- Tickets 模块进度展示
- Agent runs/artifacts 展示
- 审批闸门 + 审计日志
- RBAC (Admin/Member)

## Repository structure
- `apps/dashboard_api/`: FastAPI + SQLAlchemy + Alembic
- `apps/dashboard_web/`: Next.js 最小看板 UI
- `infra/docker-compose.yml`: Postgres 开发环境

## Quickstart
1. 启动数据库
```bash
docker compose -f infra/docker-compose.yml up -d
```

2. 安装 API 依赖并配置环境
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

3. 执行迁移 + RBAC seed
```bash
cd apps/dashboard_api
PYTHONPATH=. alembic upgrade head
PYTHONPATH=. python -m src.seed
```

4. 启动 API
```bash
cd apps/dashboard_api
PYTHONPATH=. uvicorn src.main:app --reload --port 8000
```

5. 启动 Web
```bash
cd apps/dashboard_web
npm install
npm run dev
```

## INSTALL / RBAC docs
- 详细安装：`docs/INSTALL.md`
- 权限说明：`docs/RBAC.md`

## API checks
```bash
curl http://localhost:8000/health
curl -H "Authorization: Bearer member-dev-token" http://localhost:8000/tickets
curl -X POST -H "Authorization: Bearer admin-dev-token" http://localhost:8000/tickets/1/approve
```
