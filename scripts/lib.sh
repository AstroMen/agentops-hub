#!/usr/bin/env bash

set -o pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_BLUE='\033[0;34m'
COLOR_RESET='\033[0m'

log_info() {
  echo -e "${COLOR_BLUE}[INFO]${COLOR_RESET} $*"
}

log_warn() {
  echo -e "${COLOR_YELLOW}[WARN]${COLOR_RESET} $*"
}

log_success() {
  echo -e "${COLOR_GREEN}[OK]${COLOR_RESET} $*"
}

log_error() {
  echo -e "${COLOR_RED}[ERROR]${COLOR_RESET} $*" >&2
}

fail() {
  log_error "$*"
  exit 1
}

check_cmd() {
  local cmd="$1"
  local tip="${2:-Please install '$cmd' and retry.}"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    fail "Missing required command: $cmd. $tip"
  fi
}

retry() {
  local attempts="$1"
  local sleep_seconds="$2"
  shift 2

  local n=1
  until "$@"; do
    if [[ "$n" -ge "$attempts" ]]; then
      return 1
    fi
    n=$((n + 1))
    sleep "$sleep_seconds"
  done
}

wait_for_http() {
  local url="$1"
  local timeout_seconds="$2"
  local elapsed=0
  while ! curl -sf "$url" >/dev/null 2>&1; do
    if [[ "$elapsed" -ge "$timeout_seconds" ]]; then
      return 1
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
}
