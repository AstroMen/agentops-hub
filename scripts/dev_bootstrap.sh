#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

cd "$PROJECT_ROOT"

check_cmd docker "Install Docker Desktop / Docker Engine first."
check_cmd python3 "Install Python 3.11+ first."
check_cmd alembic "Install API dependencies (pip install -r requirements.txt)."

log_info "[1/4] Ensuring Postgres is running..."
if docker ps --format '{{.Names}}' | grep -Eq '^(agentops_db|agentops-postgres)$'; then
  log_info "Detected running Postgres container (agentops_db/agentops-postgres); skipping docker compose up."
elif ! docker compose -f infra/docker-compose.yml up -d postgres; then
  fail "Unable to start Postgres. If port 5432 is already in use, either stop the conflicting container/process or set DATABASE_URL to the running Postgres instance. For compose logs: 'docker compose -f infra/docker-compose.yml logs postgres'."
fi
log_success "Postgres container is available."

log_info "[2/4] Waiting for database readiness (timeout: 60s)..."
if ! python3 - <<'PY'
import os
import time

import psycopg

url = os.getenv("DATABASE_URL", "postgresql://agentops:agentops@localhost:5432/agentops")
max_wait_seconds = 60
start = time.time()
last_error = ""

while time.time() - start < max_wait_seconds:
    try:
        with psycopg.connect(url, connect_timeout=3):
            print("Database is ready.")
            raise SystemExit(0)
    except Exception as exc:  # noqa: BLE001
        last_error = str(exc)
        time.sleep(2)

print(f"Database readiness timed out after {max_wait_seconds}s. Last error: {last_error}")
raise SystemExit(1)
PY
then
  fail "Database is not ready. Verify local port 5432 and run 'docker compose -f infra/docker-compose.yml logs postgres'."
fi
log_success "Database is ready."

log_info "[3/4] Running Alembic migrations..."
if ! (cd apps/dashboard_api && PYTHONPATH=. alembic upgrade head); then
  fail "Migration failed. Check API dependencies/environment and retry."
fi
log_success "Migrations completed."

log_info "[4/4] Seeding development RBAC data..."
if ! python3 scripts/seed_dev.py; then
  fail "Seed failed. Check previous error logs and retry."
fi
log_success "Development bootstrap complete."
