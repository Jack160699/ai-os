#!/usr/bin/env bash
# One-shot dependency install for Ubuntu EC2 (Python 3.10+).
# Run from the repository root after git clone, e.g. /opt/ai-os
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Then install systemd + nginx configs (paths assume /opt/ai-os; edit ai-os.service if different).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if [[ ! -f "run.py" ]] || [[ ! -f "requirements.txt" ]]; then
  echo "Error: run deploy.sh from the ai-os repository root (where run.py lives)." >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "Error: python3 not found. On Ubuntu: sudo apt update && sudo apt install -y python3 python3-venv python3-pip" >&2
  exit 1
fi

python3 -m venv .venv
# shellcheck source=/dev/null
source .venv/bin/activate
python -m pip install --upgrade pip wheel
pip install -r requirements.txt

# Fail fast if Gunicorn cannot import the app (env, imports, syntax).
python -c "import run; assert run.app is not None; print('Import OK:', run.app.name)"

echo ""
echo "Dependencies installed. Next steps (install path = ${ROOT}):"
echo "  1. Copy .env.example to .env and fill secrets (never commit .env)."
echo "  2. If not using /opt/ai-os, edit WorkingDirectory and ExecStart in ai-os.service to match ${ROOT}"
echo "  3. sudo cp ${ROOT}/ai-os.service /etc/systemd/system/"
echo "  4. sudo systemctl daemon-reload && sudo systemctl enable --now ai-os"
echo "  5. sudo cp ${ROOT}/nginx.conf /etc/nginx/sites-available/ai-os && sudo ln -sf /etc/nginx/sites-available/ai-os /etc/nginx/sites-enabled/"
echo "  6. sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "Redeploy after git pull:"
echo "  git pull && ./deploy.sh && sudo systemctl restart ai-os"
