# INSTALL

## 1) Start Postgres
```bash
docker compose -f infra/docker-compose.yml up -d
```

Dev DB account:
- user: `agentops`
- password: `agentops`
- db: `agentops`

## 2) API setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

## 3) Run bootstrap (wait DB + migrations + seed)
```bash
./scripts/dev_bootstrap.sh
```

## 4) Start API
```bash
cd apps/dashboard_api
PYTHONPATH=. uvicorn src.main:app --reload --port 8000
```

## 5) Start Web
```bash
cd apps/dashboard_web
npm install
npm run dev
```

## 6) Basic verification
```bash
curl -H "Authorization: Bearer member-dev-token" http://localhost:8000/tickets
curl -H "Authorization: Bearer admin-dev-token" http://localhost:8000/runs
```
