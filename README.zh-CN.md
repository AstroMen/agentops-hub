# AgentOps Dashboard Framework v0.1

一个可复用的 Dashboard Framework，覆盖：
- Tickets 模块进度展示
- Agent runs/artifacts 展示
- 审批闸门 + 审计日志
- RBAC（Admin/Member）

## 仓库结构
- `apps/dashboard_api/`: FastAPI + SQLAlchemy + Alembic
- `apps/dashboard_web/`: Next.js 看板 UI
- `infra/docker-compose.yml`: 本地开发 Postgres

## 业务逻辑总览

### Tickets（工单）
- 工单创建时包含 `type`、`priority`、`assigned_agent` 等字段，默认进入 `PENDING_APPROVAL`。
- Member/Admin 都可查看工单；Admin 负责核心流转动作（`approve/reject/queue`）。
- 编辑接口（`PUT /tickets/{id}`、`POST /tickets/{id}/update`）由后端做权限和状态校验。

### Runs（执行）
- Run 表示一次 Agent 执行记录，由 Admin 驱动生命周期。
- Admin 可发起下一次执行（`POST /runs/next`）并完成执行（`POST /runs/{id}/finish`）。
- 状态流转必须合法，不合法会返回 `409`。

### Agents（执行体）
- Agent 作为工单可分配的执行对象。
- Agent 的增删改查（`/agents`）在 API 层是 Admin-only。
- 前端会根据角色隐藏/展示管理入口，但最终权限仍以后端鉴权结果为准。

### 权限与 Token 业务逻辑（Dashboard Web + API）
1. **后端鉴权是唯一权限来源**
   - API 只认 `Authorization: Bearer <token>`。
   - `ADMIN_TOKEN` 映射为 Admin，`MEMBER_TOKEN` 映射为 Member。
   - 前端页面上的「是否可操作」仅用于 UX 提示；真正权限由后端 `401/403` 决定。

2. **前端登录与本地状态**
   - 登录页内置两组开发账号：`admin/admin` 与 `member/member`。
   - 登录成功后，前端会写入：
     - `localStorage.dashboard_token`
     - `localStorage.dashboard_username`
   - 页面判定角色时，优先使用 `username`，缺失时再回退到 token 比对。

3. **`NEXT_PUBLIC_MEMBER_TOKEN` 的配置要点**
   - `NEXT_PUBLIC_*` 变量会暴露到浏览器，只应放开发/演示 token。
   - 若后端 `MEMBER_TOKEN` 变更，前端 `NEXT_PUBLIC_MEMBER_TOKEN` 必须同步更新。
   - 否则 member 登录后请求会出现 `401 Invalid token`。

4. **推荐本地联调检查**
```bash
curl -H "Authorization: Bearer ${ADMIN_TOKEN:-admin-dev-token}" http://localhost:8000/tickets
curl -H "Authorization: Bearer ${MEMBER_TOKEN:-member-dev-token}" http://localhost:8000/tickets
```

## 快速开始

### 方式 1：使用启动脚本（推荐）
```bash
# 一条命令完成 DB bootstrap + API + Web 启动
./scripts/start_dev.sh
```

服务地址：
- API: http://localhost:8000
- Web: http://localhost:3000

### 方式 2：手动启动

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

3. 执行 bootstrap（等待 DB + 迁移 + seed）
```bash
./scripts/dev_bootstrap.sh
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

## 英文版 README
- English documentation: `README.md`

## 安装与 RBAC 文档
- 安装说明：`docs/INSTALL.md`
- 权限说明：`docs/RBAC.md`

## API 检查
```bash
curl http://localhost:8000/health
curl -H "Authorization: Bearer member-dev-token" http://localhost:8000/tickets
curl -X POST -H "Authorization: Bearer admin-dev-token" http://localhost:8000/tickets/1/approve
```

## 故障排查

### 重启服务
脚本会自动做 DB bootstrap 并启动 API/Web，可直接用于重启：
```bash
./scripts/start_dev.sh
```

### 手动重启
```bash
pkill -f "uvicorn src.main:app" && pkill -f "next dev"
cd apps/dashboard_api && python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
cd apps/dashboard_web && npm run dev &
```

### 查看 API 日志
```bash
# 查看日志文件
tail -f /tmp/agentops_api.log

# 或使用 process 工具
process action=list
process action=log sessionId=<session-id>
```

### 查看 Web 日志
```bash
tail -f /tmp/agentops_web.log
```

### 常见问题
- **404 Not Found**: 检查 API 是否重启，新路由是否加载（运行 `./scripts/start_dev.sh` 重启）
- **401 Unauthorized**: 检查 token 是否正确（默认: `admin-dev-token` / `member-dev-token`）
- **数据库连接失败**: 确认 PostgreSQL 容器运行中 `docker ps`
