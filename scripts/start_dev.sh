#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting AgentOps Dashboard services...${NC}"

# Start API
echo -e "${YELLOW}Starting API...${NC}"
pkill -f "uvicorn src.main:app" 2>/dev/null || true
cd apps/dashboard_api
PYTHONPATH=. nohup python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 > /tmp/api.log 2>&1 &
sleep 2

if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}API started successfully${NC}"
else
    echo -e "Failed to start API"
    cat /tmp/api.log
    exit 1
fi

# Start Web
echo -e "${YELLOW}Starting Web...${NC}"
pkill -f "next dev" 2>/dev/null || true
cd "$PROJECT_ROOT/apps/dashboard_web"
nohup npm run dev > /tmp/web.log 2>&1 &
sleep 5

if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}Web started successfully${NC}"
else
    echo -e "Failed to start Web"
    cat /tmp/web.log
    exit 1
fi

echo -e "${GREEN}Done!${NC}"
echo "API: http://localhost:8000"
echo "Web: http://localhost:3000"
