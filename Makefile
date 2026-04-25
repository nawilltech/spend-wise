.PHONY: setup dev dev-api dev-mobile lint test clean

# ── Setup ────────────────────────────────────────────────────────────
setup: setup-mobile setup-api

setup-mobile:
	cd apps/mobile && npm install

setup-api:
	cd apps/api && python -m venv .venv && \
	. .venv/bin/activate && \
	pip install -r requirements.txt -r requirements-dev.txt

# ── Dev servers ──────────────────────────────────────────────────────
dev:
	make -j2 dev-api dev-mobile

dev-api:
	cd apps/api && . .venv/bin/activate && \
	uvicorn app.main:app --reload --port 8000

dev-mobile:
	cd apps/mobile && npx expo start

dev-worker:
	cd apps/api && . .venv/bin/activate && \
	celery -A app.workers.celery_app worker --loglevel=info

# ── Database ─────────────────────────────────────────────────────────
migrate:
	cd apps/api && . .venv/bin/activate && alembic upgrade head

migrate-create:
	cd apps/api && . .venv/bin/activate && alembic revision --autogenerate -m "$(name)"

migrate-down:
	cd apps/api && . .venv/bin/activate && alembic downgrade -1

# ── Lint & Type check ────────────────────────────────────────────────
lint: lint-mobile lint-api

lint-mobile:
	cd apps/mobile && npm run lint

lint-api:
	cd apps/api && . .venv/bin/activate && \
	ruff check app/ && mypy app/

type-check:
	cd apps/mobile && npm run type-check

# ── Tests ────────────────────────────────────────────────────────────
test: test-api

test-api:
	cd apps/api && . .venv/bin/activate && \
	pytest tests/ -v --cov=app --cov-report=term-missing

# ── Build ────────────────────────────────────────────────────────────
build-android:
	cd apps/mobile && npx eas build --platform android

build-ios:
	cd apps/mobile && npx eas build --platform ios

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
