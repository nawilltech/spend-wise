FROM python:3.13-slim

WORKDIR /app

# Install system deps needed by psycopg2 and other C-extension packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python deps first (layer-cached unless requirements change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

# Run migrations then start the server
# $PORT is injected by Render at runtime
CMD ["sh", "-c", "alembic upgrade head && python -m scripts.seed_admin && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
