# Tech Stack — SpendWise

## Mobile (apps/mobile/)

### React Native + Expo
**What:** Cross-platform mobile framework  
**Why:** Single codebase for iOS and Android; Expo adds camera, speech, notifications, and secure storage APIs with zero native config.  
**Version:** Expo SDK 51, React Native 0.74

### Expo Router
**What:** File-based routing for React Native (like Next.js App Router)  
**Why:** Screens map directly to files in `app/`; handles deep linking, auth guards, and tab navigation automatically.

### WatermelonDB
**What:** Offline-first reactive database for React Native (SQLite under the hood)  
**Why:** Built specifically for mobile offline-first. Lazy loading, reactive queries (re-renders on data change), and a built-in sync protocol. Far better than AsyncStorage for relational finance data.

### Zustand
**What:** Minimal state management  
**Why:** Lightweight (~1KB). Handles ephemeral UI state (auth tokens, modal state, selected currency) that doesn't belong in WatermelonDB.

### Axios
**What:** HTTP client  
**Why:** Interceptors for attaching JWT tokens and handling 401 refresh flows cleanly.

### Victory Native
**What:** Charting library for React Native  
**Why:** Composable chart components (bar, line, pie) that work offline. Built on react-native-svg.

### date-fns
**What:** Date utility library  
**Why:** Lightweight, tree-shakeable. Used for all date formatting, period calculations, and relative time display.

---

## Backend (apps/api/)

### FastAPI
**What:** Modern async Python web framework  
**Why:** Native async/await, automatic OpenAPI docs, Pydantic integration for request/response validation, and best-in-class Python AI library support. Faster and leaner than Django REST for an API-only service.

### SQLAlchemy 2.0
**What:** Python ORM  
**Why:** Mature, flexible. SQLAlchemy 2.0 adds native async support. Used with Alembic for database migrations.

### Alembic
**What:** Database migration tool for SQLAlchemy  
**Why:** Version-controlled schema changes with up/down migrations.

### PostgreSQL 15
**What:** Primary relational database  
**Why:** ACID compliance critical for financial data. JSONB for flexible AI insights storage. Strong support for date/time and currency operations.

### Redis 7
**What:** In-memory cache and message broker  
**Why:** Caches exchange rates (24h TTL), stores Celery task queue, and handles rate limiting.

### Celery
**What:** Distributed task queue  
**Why:** Runs scheduled AI analysis jobs (monthly reports, weekly summaries) and async work (PDF generation, push notifications) outside the request cycle.

### Pydantic v2
**What:** Data validation library  
**Why:** Validates all incoming API requests and shapes all outgoing responses. Integrated natively with FastAPI.

### pandas
**What:** Data analysis library  
**Why:** Aggregates transaction data (totals by category, period trends, savings rate) before passing to AI. Much faster than doing this in SQL for analysis workloads.

---

## AI Layer

### Google Gemini 1.5 Flash
**What:** Primary LLM for all AI features  
**Why:** Most generous free tier (1M tokens/day), strong reasoning for financial advice, supports function calling for structured JSON output from voice parsing.  
**Free tier:** 15 RPM, 1M tokens/day  
**Used for:** Budget advice, investment suggestions, spend analysis, voice expense parsing

### Groq + Whisper Large v3
**What:** Fast speech-to-text transcription  
**Why:** Groq's inference is extremely fast (real-time). Free tier sufficient for MVP. Used specifically for voice expense entry.  
**Free tier:** ~14,400 requests/day

### LangChain (optional)
**What:** AI orchestration framework  
**Why:** Useful for building prompt chains and managing system prompts. Optional — can use Gemini SDK directly if simpler.

---

## Currency

### Open Exchange Rates API
**What:** Currency exchange rate provider  
**Why:** Reliable, 150+ currencies, free tier provides hourly rates. Cached in Redis so only 1 API call per 24h, never inline in a request.  
**Free tier:** 1000 requests/month (more than enough with caching)

---

## Infrastructure

### Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for full options.

| Service | Tool |
|---------|------|
| API hosting | Railway / Render / AWS |
| Mobile builds | Expo EAS Build |
| Database | Supabase (managed Postgres) or self-hosted |
| Redis | Upstash (serverless) or Railway |
| Storage | Cloudflare R2 (receipts, exports) |

### CI/CD
- GitHub Actions — lint, type-check, test on every PR
- Expo EAS — mobile builds on merge to main

### Monitoring
- Sentry — error tracking (mobile + API)
- PostHog — product analytics (optional)

---

## Summary Table

| Layer | Technology | License / Cost |
|-------|-----------|----------------|
| Mobile framework | React Native + Expo | MIT / Free |
| Local DB | WatermelonDB | MIT / Free |
| State | Zustand | MIT / Free |
| Charts | Victory Native | MIT / Free |
| API framework | FastAPI | MIT / Free |
| ORM | SQLAlchemy + Alembic | MIT / Free |
| Database | PostgreSQL | MIT / Free |
| Cache / Queue | Redis + Celery | BSD / Free |
| Data analysis | pandas | BSD / Free |
| AI - LLM | Gemini 1.5 Flash | Free tier |
| AI - Voice | Groq Whisper | Free tier |
| Currency | Open Exchange Rates | Free tier |
| Builds | Expo EAS | Free tier |
