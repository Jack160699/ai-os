#!/usr/bin/env bash
# Run ON THE PRODUCTION SERVER (e.g. via GitHub Actions SSH), not on your laptop.
#
# Prerequisites (one-time on EC2):
#   - Repo at APP_ROOT (default /opt/ai-os), remote "origin" → GitHub
#   - backend/deploy.sh already run once (venv exists)
#   - systemd: ai-os.service with ExecReload (HUP) for graceful reload
#   - Deploy user: passwordless sudo for: systemctl reload|restart ai-os
#
# Environment (optional):
#   APP_ROOT   — repo root (default /opt/ai-os)

set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/ai-os}"
BACKEND_DIR="${APP_ROOT}/backend"
SERVICE_NAME="${SERVICE_NAME:-ai-os}"

if [[ ! -d "$APP_ROOT/.git" ]]; then
  echo "ERROR: $APP_ROOT is not a git clone (missing .git)." >&2
  exit 1
fi

cd "$APP_ROOT"

# Match GitHub default branch (override if you use a different production branch).
GIT_BRANCH="${GIT_BRANCH:-main}"

git fetch origin "$GIT_BRANCH"
git checkout "$GIT_BRANCH"
git pull --ff-only "origin" "$GIT_BRANCH"

if [[ ! -f "$BACKEND_DIR/deploy.sh" ]]; then
  echo "ERROR: missing $BACKEND_DIR/deploy.sh" >&2
  exit 1
fi

bash "$BACKEND_DIR/deploy.sh"

# Prefer graceful worker reload (Gunicorn HUP); falls back to restart if reload unsupported.
if sudo systemctl reload "$SERVICE_NAME" 2>/dev/null; then
  :
else
  echo "Note: reload not available — restarting $SERVICE_NAME"
  sudo systemctl restart "$SERVICE_NAME"
fi

COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "NEW VERSION DEPLOYED commit=${COMMIT} time=${TS}"
if command -v logger >/dev/null 2>&1; then
  logger -t stratxcel-deploy "NEW VERSION DEPLOYED commit=${COMMIT} time=${TS}"
fi
