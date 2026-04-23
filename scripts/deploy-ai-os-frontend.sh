#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="${APP_ROOT:-/opt/ai-os}"
APP_DIR="${APP_ROOT}/apps/ai-os"
BRANCH="${BRANCH:-main}"

cd "${APP_ROOT}"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull --ff-only origin "${BRANCH}"

npm ci
npm --workspace @stratxcel/ai-os run build

pm2 delete stratxcel-frontend >/dev/null 2>&1 || true
pm2 start "${APP_ROOT}/ecosystem.ai-os.cjs"
pm2 save

echo "deployed frontend commit=$(git rev-parse --short HEAD)"
