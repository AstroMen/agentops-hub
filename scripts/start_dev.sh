#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./lib.sh
source "$SCRIPT_DIR/lib.sh"

API_PID=""
WEB_PID=""

cleanup() {
  log_info "Shutting down local dev services..."
  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" >/dev/null 2>&1; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" >/dev/null 2>&1; then
    kill "$WEB_PID" >/dev/null 2>&1 || true
  fi
  wait >/dev/null 2>&1 || true
  log_success "All child processes stopped."
}

trap cleanup EXIT INT TERM

cd "$PROJECT_ROOT"

check_cmd curl
check_cmd npm "Install Node.js + npm first."
check_cmd python3

log_info "Bootstrapping development dependencies (DB/migrations/seed)..."
if ! "$SCRIPT_DIR/dev_bootstrap.sh"; then
  fail "Bootstrap failed. See errors above; common checks: Docker status, Python deps, and DB port 5432."
fi
log_success "Bootstrap finished."

log_info "Ensuring web dependencies are installed..."
if [[ ! -d "$PROJECT_ROOT/apps/dashboard_web/node_modules" ]]; then
  log_warn "node_modules not found; running npm install..."
  if ! (cd apps/dashboard_web && npm install); then
    fail "npm install failed. Fix npm errors and rerun ./scripts/start_dev.sh"
  fi
fi
log_success "Web dependencies ready."

log_info "Starting dashboard_api (FastAPI)..."
(
  cd apps/dashboard_api
  PYTHONPATH=. python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000
) > /tmp/agentops_api.log 2>&1 &
API_PID=$!

if ! wait_for_http "http://localhost:8000/health" 30; then
  log_error "API failed health check. Last logs:"
  tail -n 50 /tmp/agentops_api.log || true
  fail "Unable to start dashboard_api."
fi
log_success "dashboard_api is running at http://localhost:8000"

log_info "Starting dashboard_web (Next.js)..."
(
  cd apps/dashboard_web
  npm run dev
) > /tmp/agentops_web.log 2>&1 &
WEB_PID=$!

if ! wait_for_http "http://localhost:3000" 45; then
  log_error "Web failed health check. Last logs:"
  tail -n 50 /tmp/agentops_web.log || true
  fail "Unable to start dashboard_web."
fi
log_success "dashboard_web is running at http://localhost:3000"

log_success "Dev stack is ready. Press Ctrl+C to stop both services."
wait "$API_PID" "$WEB_PID"
