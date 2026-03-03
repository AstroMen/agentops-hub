# AgentOps Dashboard Framework v0.1

一个可复用的全栈 Dashboard 框架，用于工单流程管理、执行记录追踪、审计日志与角色权限控制。

## 包含内容

- **Dashboard API**：基于 FastAPI + SQLAlchemy + Alembic。
- **Dashboard Web**：基于 Next.js App Router。
- **本地基础设施**：通过 Docker Compose 启动 PostgreSQL。
- **开发脚本**：提供 bootstrap、seed、一键启动等能力。

## 仓库结构

- `apps/dashboard_api/` —— 后端服务。
- `apps/dashboard_web/` —— 前端服务。
- `infra/docker-compose.yml` —— 本地 PostgreSQL。
- `scripts/` —— 开发辅助脚本。
- `docs/` —— 安装与 RBAC 文档。

## 核心业务流程

### Tickets（工单）

- 创建工单时支持 `type`、`priority`、`assigned_agent` 等字段。
- 新建工单默认状态为 `PENDING_APPROVAL`。
- 仅 Admin 可执行 approve/reject/queue。
- `PUT /tickets/{id}` 与 `POST /tickets/{id}/update` 都支持编辑，并有权限校验。

### Runs（执行记录）

- Admin 通过 `POST /runs/next` 从排队工单发起执行。
- Admin 通过 `POST /runs/{id}/finish` 结束执行，状态仅允许 `DONE` 或 `FAILED`。
- 工单状态遵循生命周期约束（`QUEUED -> RUNNING -> DONE/FAILED`）。

### Agents（执行体）

- Agent 作为工单可分配的执行对象。
- `/agents` 的增删改接口均为 Admin-only。
- 若 Agent 已被工单引用，则禁止删除。

### Audit Logs（审计日志）

- 工单、Agent、Run 的关键操作会写入审计日志。
- 审计日志查询接口 `GET /audit-logs` 为 Admin-only。

## 鉴权与权限模型

- 后端鉴权是唯一权限来源。
- API 通过 `Authorization: Bearer <token>` 进行认证。
- `ADMIN_TOKEN` 对应 Admin，`MEMBER_TOKEN` 对应 Member。
- 前端的角色显示仅用于交互提示，最终权限以后端返回 `401/403` 为准。

### 前端开发登录

- 内置账号：
  - `admin / admin`
  - `member / member`
- 登录后前端会存储：
  - `localStorage.dashboard_token`
  - `localStorage.dashboard_username`

### Token 对齐说明

如果你修改了后端 `.env` 中的 token，前端 `NEXT_PUBLIC_*` token 变量也需要同步更新。

## 快速开始

### 方式一（推荐）：一键启动

```bash
./scripts/start_dev.sh
```

该脚本默认会：

1. 执行数据库 bootstrap（等待 + 迁移 + seed）。
2. 检查并安装前端依赖。
3. 启动 API（`http://localhost:8000`）。
4. 启动 Web（`http://localhost:3000`）。

### 方式二：手动启动

1. 启动 PostgreSQL：

```bash
docker compose -f infra/docker-compose.yml up -d
```

2. 准备 Python 环境：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

3. 执行数据库 bootstrap + 迁移 + seed：

```bash
./scripts/dev_bootstrap.sh
```

4. 启动 API：

```bash
cd apps/dashboard_api
PYTHONPATH=. uvicorn src.main:app --reload --port 8000
```

5. 启动 Web：

```bash
cd apps/dashboard_web
npm install
npm run dev
```

## 环境变量

来自 `.env.example`：

- `DATABASE_URL`
- `ADMIN_TOKEN`
- `MEMBER_TOKEN`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_ADMIN_TOKEN`

前端同样支持 `NEXT_PUBLIC_MEMBER_TOKEN`（未设置时默认使用 `member-dev-token`）。

## API 快速检查

```bash
curl http://localhost:8000/health
curl -H "Authorization: Bearer member-dev-token" http://localhost:8000/tickets
curl -H "Authorization: Bearer admin-dev-token" http://localhost:8000/runs
curl -X POST -H "Authorization: Bearer admin-dev-token" http://localhost:8000/tickets/1/approve
```

## 测试

本地运行 API 测试：

```bash
PYTHONPATH=apps/dashboard_api pytest -q apps/dashboard_api/tests
```

## CI

CI 工作流：`.github/workflows/ci.yml`

- `api-tests`：执行后端测试。
- `web-build`：执行前端构建检查。

触发方式：

- Pull Request
- 推送到 `main`
- 手动触发

## 故障排查

### 使用脚本重启

```bash
./scripts/start_dev.sh
```

### 后台模式启动

```bash
./scripts/start_dev.sh --detach
```

### 查看日志

```bash
tail -f /tmp/agentops_api.log
tail -f /tmp/agentops_web.log
```

### 常见问题

- **401 Unauthorized**：检查 token 是否正确，及前后端 token 是否一致。
- **409 Conflict**：检查状态流转是否合法。
- **数据库连接失败**：确认 PostgreSQL 容器是否运行（`docker ps`）。

## 其他文档

- 英文 README：`README.md`
- 安装说明：`docs/INSTALL.md`
- RBAC 说明：`docs/RBAC.md`
