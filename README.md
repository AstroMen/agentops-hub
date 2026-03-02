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

## API checks
```bash
curl http://localhost:8000/health
curl -H "Authorization: Bearer member-dev-token" http://localhost:8000/tickets
curl -X POST -H "Authorization: Bearer admin-dev-token" http://localhost:8000/tickets/1/approve
```

## Troubleshooting

### 重启服务
脚本会先停止现有服务再启动，所以可以直接用于重启：
```bash
./scripts/start_dev.sh
```

### 手动重启服务
```bash
# 停止现有进程
pkill -f "uvicorn src.main:app" && pkill -f "next dev"

# 启动
cd apps/dashboard_api && python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
cd apps/dashboard_web && npm run dev &
```

### 查看 API 日志
```bash
# 查看日志文件
tail -f /tmp/api.log

# 或使用 process 工具
process action=list
process action=log sessionId=<session-id>
```

### 查看 Web 日志
```bash
tail -f /tmp/web.log
```

### 常见问题
- **404 Not Found**: 检查 API 是否重启，新路由是否加载（运行 `./scripts/start_dev.sh` 重启）
- **401 Unauthorized**: 检查 token 是否正确（默认: `admin-dev-token` / `member-dev-token`）
- **数据库连接失败**: 确认 PostgreSQL 容器运行中 `docker ps`
