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

### Option 1: Use start script (recommended)
```bash
# Start both API and Web services
./scripts/start_dev.sh
```

Services:
- API: http://localhost:8000
- Web: http://localhost:3000

### Option 2: Manual start

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

## Troubleshooting

### 查看 API 日志
API 服务运行在后台时，日志会输出到进程终端。

1. **查看当前运行的 API 进程**:
   ```bash
   ps aux | grep uvicorn
   ```

2. **使用 process 工具查看日志**:
   ```bash
   # 列出所有后台会话
   process action=list

   # 查看特定会话的日志 (替换 <session-id>)
   process action=log sessionId=<session-id>
   ```

3. **常见问题**:
   - **404 Not Found**: 检查 API 是否重启，新路由是否加载（尝试重启服务）
   - **401 Unauthorized**: 检查 token 是否正确（默认: `admin-dev-token` / `member-dev-token`）
   - **数据库连接失败**: 确认 PostgreSQL 容器运行中 `docker ps`

### 查看 Web 日志
Next.js 前端日志同样输出到终端，检查 npm 进程：
```bash
ps aux | grep "next dev"
```

### 重启服务
```bash
# 停止现有进程
pkill -f "dashboard_api" && pkill -f "dashboard_web"

# 重启
cd apps/dashboard_api && python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
cd apps/dashboard_web && npm run dev
```
