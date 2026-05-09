.PHONY: setup dev dev-api dev-mobile dev-web lint test clean \
        build-android build-ios release-preview release-production \
        deploy-api docker-build

# ── Setup ────────────────────────────────────────────────────────────
setup: setup-mobile setup-api setup-web

setup-mobile:
	cd apps/mobile && npm install

setup-api:
	cd apps/api && python3 -m venv .venv && \
	. .venv/bin/activate && \
	pip install -r requirements.txt -r requirements-dev.txt

setup-web:
	cd apps/web && npm install

# ── Dev servers ──────────────────────────────────────────────────────
dev:
	make -j3 dev-api dev-mobile dev-web

dev-api:
	cd apps/api && .venv/bin/uvicorn app.main:app --reload --reload-include "*.env" --port 8000

dev-mobile:
	cd apps/mobile && npx expo start --offline

dev-web:
	cd apps/web && npm run dev

dev-worker:
	cd apps/api && .venv/bin/celery -A app.workers.celery_app worker --loglevel=info

# ── Database ─────────────────────────────────────────────────────────
seed-admin:
	cd apps/api && .venv/bin/python -m scripts.seed_admin

# Generate a new migration by diffing models against the live DB.
# Usage: make migrate-gen name="add email verified to users"
migrate-gen:
	cd apps/api && .venv/bin/alembic revision --autogenerate -m "$(name)"

# Apply all pending migrations (safe to run repeatedly — skips already-applied ones).
migrate:
	cd apps/api && .venv/bin/alembic upgrade head

# Roll back the last applied migration.
migrate-down:
	cd apps/api && .venv/bin/alembic downgrade -1

# Roll back N migrations. Usage: make migrate-down-n n=3
migrate-down-n:
	cd apps/api && .venv/bin/alembic downgrade -$(n)

# Roll back all migrations to a clean slate.
migrate-reset:
	cd apps/api && .venv/bin/alembic downgrade base

# Show which revision the DB is currently at.
migrate-status:
	cd apps/api && .venv/bin/alembic current

# Show the full migration history with applied/pending status.
migrate-history:
	cd apps/api && .venv/bin/alembic history --verbose

# Show SQL that would be run without actually running it.
migrate-preview:
	cd apps/api && .venv/bin/alembic upgrade head --sql

# Mark the DB as being at the latest revision without running any SQL.
# Use after manually creating tables (e.g. fresh dev setup).
migrate-stamp:
	cd apps/api && .venv/bin/alembic stamp head

# ── Lint & Type check ────────────────────────────────────────────────
lint: lint-mobile lint-api

lint-mobile:
	cd apps/mobile && npm run lint

lint-api:
	cd apps/api && .venv/bin/ruff check app/ && .venv/bin/mypy app/

type-check:
	cd apps/mobile && npm run type-check

# ── Tests ────────────────────────────────────────────────────────────
test: test-api

test-api:
	cd apps/api && .venv/bin/pytest tests/ -v --cov=app --cov-report=term-missing

# ── Build ────────────────────────────────────────────────────────────
build-android:
	cd apps/mobile && npx eas build --platform android --profile production

build-ios:
	cd apps/mobile && npx eas build --platform ios --profile production

# Internal test builds (APK + IPA distributed via link, no store review)
release-preview:
	cd apps/mobile && npx eas build --platform all --profile preview

# Full production builds for App Store + Play Store
release-production:
	cd apps/mobile && npx eas build --platform all --profile production

# Build and submit in one step (production only)
submit-ios:
	cd apps/mobile && npx eas submit --platform ios --latest

submit-android:
	cd apps/mobile && npx eas submit --platform android --latest

# Build the API Docker image locally (useful for testing before pushing)
docker-build:
	docker build -t spendwise-api:local ./apps/api

# Manually trigger Render deploy via webhook
# Usage: RENDER_HOOK=<your-hook-url> make deploy-api
deploy-api:
	curl -f -X POST "$(RENDER_HOOK)"

# ── Utilities ────────────────────────────────────────────────────────
clean:
	cd apps/mobile && rm -rf node_modules .expo
	cd apps/api && rm -rf .venv __pycache__ .pytest_cache

format-api:
	cd apps/api && . .venv/bin/activate && ruff format app/ tests/

docker-up:
	docker-compose up -d postgres redis

docker-down:
	docker-compose down
