#!/usr/bin/env bash
# deploy.sh — run migrations then start the API server.
# Called by the process manager (Docker CMD, Railway start command, etc.)
# Usage: ./scripts/deploy.sh
#        SEED_ADMIN=1 ./scripts/deploy.sh   ← also seed the admin user

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(dirname "$SCRIPT_DIR")"

cd "$API_DIR"

echo "==> Running database migrations..."
alembic upgrade head

if [[ "${SEED_ADMIN:-0}" == "1" ]]; then
  echo "==> Seeding admin user..."
  python -m scripts.seed_admin
fi

echo "==> Starting API server..."
exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT:-8000}" \
  --workers "${WORKERS:-1}"
