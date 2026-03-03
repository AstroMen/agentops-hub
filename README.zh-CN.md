# AgentOps Dashboard Framework v0.1

可复用的 Dashboard Framework，覆盖：
- Tickets 模块进度展示
- Agent runs/artifacts 展示
- 审批闸门 + 审计日志
- RBAC (Admin/Member)

## 仓库结构
- `apps/dashboard_api/`: FastAPI + SQLAlchemy + Alembic
- `apps/dashboard_web/`: Next.js 最小看板 UI
- `infra/docker-compose.yml`: Postgres 开发环境

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

<img width="1274" height="827" alt="image" src="https://github.com/user-attachments/assets/b4dba5dd-99df-4064-86fb-cc665564eb4a" />

## 安装与权限文档
- 详细安装：`docs/INSTALL.md`
- 权限说明：`docs/RBAC.md`
- English README: `README.md`

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
