# Deployment Guide — SpendWise

## Environments
| Env | Purpose |
|-----|---------|
| `development` | Local machine, hot reload |
| `staging` | Pre-production, mirrors prod setup |
| `production` | Live users |

---

## Mobile (React Native + Expo)

### Development
```bash
cd apps/mobile
npx expo start          # scan QR code with Expo Go app
npx expo start --ios    # iOS simulator
npx expo start --android # Android emulator
```

### Production Builds — Expo EAS (recommended)
EAS Build compiles native apps in the cloud — no Mac required for iOS builds.

```bash
npm install -g eas-cli
eas login
eas build:configure      # creates eas.json

# Build
eas build --platform ios     # submit to App Store
eas build --platform android # submit to Play Store

# OTA update (no store review needed for JS-only changes)
eas update --branch production --message "fix: budget chart"
```

**`eas.json` profiles:**
```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal" },
    "production":  { "autoIncrement": true }
  }
}
```

**Cost:** EAS Free tier — 30 builds/month. $29/mo for unlimited.

### Alternative: Self-hosted builds
- iOS: Requires a Mac with Xcode 15+
- Android: `./gradlew assembleRelease` in `android/`

---

## API (FastAPI)

### Option 1: Railway (Recommended for MVP)
Simplest deploy — connect GitHub repo, zero config.

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

**Railway setup:**
1. Create project → Add PostgreSQL service → Add Redis service
2. Set environment variables in Railway dashboard
3. Push to `main` → auto-deploys

**Cost:** Free tier: $5/mo credit. Hobby: $20/mo. Covers MVP easily.

### Option 2: Render
Similar to Railway, slightly better free tier.

```yaml
# render.yaml
services:
  - type: web
    name: spendwise-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: spendwise-db
          property: connectionString

databases:
  - name: spendwise-db
    plan: free

  - type: redis
    name: spendwise-redis
    plan: free
```

**Cost:** Free tier available (spins down after 15min inactivity — not for prod). Starter: $7/mo.

### Option 3: Fly.io
Good for global edge deployment. Docker-based.

```toml
# fly.toml
app = "spendwise-api"
primary_region = "lhr"  # London — or pick closest to users

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 8000
  auto_stop_machines = true

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
```

```bash
flyctl launch
flyctl deploy
flyctl postgres create --name spendwise-db
flyctl redis create --name spendwise-redis
```

**Cost:** Free tier: 3 shared VMs. Pay-as-you-go after. ~$5-15/mo for MVP.

### Option 4: AWS (Scale)
For when you need full control or are at scale.

```
ECS Fargate (API containers)  →  RDS PostgreSQL  →  ElastiCache Redis
      ↑
Application Load Balancer
      ↑
CloudFront (CDN)
```

- ECS Fargate: ~$15-50/mo depending on traffic
- RDS PostgreSQL (db.t3.micro): ~$15/mo
- ElastiCache Redis (cache.t3.micro): ~$15/mo

Use Terraform or CDK for infrastructure-as-code at this stage.

---

## Database

### Managed (recommended)
| Provider | Free Tier | Paid |
|----------|-----------|------|
| **Supabase** | 500MB, 2 projects | $25/mo |
| **Neon** | 0.5GB, unlimited projects | $19/mo |
| **Railway Postgres** | included with app | ~$5/mo |
| **Render Postgres** | 1GB free | $7/mo |

### Self-hosted (Docker)
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: spendwise
      POSTGRES_USER: spendwise
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

---

## Redis

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| **Upstash** | 10K commands/day | Serverless, HTTP-based |
| **Railway Redis** | Included with app | Simple, same platform |
| **Render Redis** | Free tier | Spins down |

---

## Environment Variables

### apps/api/.env (production)
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/spendwise

# Redis
REDIS_URL=redis://default:pass@host:6379

# Auth
SECRET_KEY=your-256-bit-random-key
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# AI
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key

# Currency
OPEN_EXCHANGE_RATES_APP_ID=your-oxr-app-id

# CORS
ALLOWED_ORIGINS=https://yourapp.com,exp://your-expo-url

# Environment
ENVIRONMENT=production
DEBUG=false
```

### apps/mobile/.env
```env
EXPO_PUBLIC_API_URL=https://api.spendwise.app
EXPO_PUBLIC_ENVIRONMENT=production
```

---

## CI/CD (GitHub Actions)

### Mobile CI — `.github/workflows/mobile-ci.yml`
Runs on every PR: lint, type-check

### API CI — `.github/workflows/api-ci.yml`
Runs on every PR: lint (ruff), type-check (mypy), tests (pytest)

### Deploy trigger
- Merge to `main` → Railway/Render auto-deploys API
- Merge to `main` → EAS Update pushes OTA to mobile

---

## Deployment Checklist (pre-launch)

- [ ] All secrets in environment variables (never in code)
- [ ] `DEBUG=false` in production
- [ ] Database migrations run: `alembic upgrade head`
- [ ] HTTPS enforced on API (handled by Railway/Render/Fly)
- [ ] CORS restricted to known origins
- [ ] Sentry DSN set for error tracking
- [ ] Exchange rate job scheduled and running
- [ ] Celery worker running alongside API
- [ ] Mobile `.env` pointing to production API URL
- [ ] EAS build submitted to App Store / Play Store
