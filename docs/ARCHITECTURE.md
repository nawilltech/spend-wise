# Architecture — SpendWise

## Overview
Offline-first mobile app with a Python API backend and AI layer powered by Google Gemini.

---

## System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    MOBILE APP (React Native + Expo)               │
│                                                                  │
│  ┌──────────────┐   ┌─────────────────────────────────────────┐  │
│  │  Voice Input │   │           UI Layer (Expo Router)        │  │
│  │  Expo Speech │   │  Dashboard │ Transactions │ Budget      │  │
│  │      ↓       │   │  Insights  │ Settings                   │  │
│  │  Groq Whisper│   └──────────────────┬──────────────────────┘  │
│  │  (STT API)   │                      │                         │
│  └──────┬───────┘                      │                         │
│         │ raw text                     │ reads / writes          │
│         ▼                              ▼                         │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │              Local Data Layer — WatermelonDB             │     │
│  │         (SQLite — works fully offline)                   │     │
│  │  transactions │ categories │ budgets │ goals             │     │
│  │  Pending sync queue (isDirty flag per record)            │     │
│  │  Cached exchange rates (refreshed every 24h)             │     │
│  └────────────────────────┬────────────────────────────────┘     │
│                           │ Sync Engine (on foreground/online)   │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTPS
                ┌───────────▼──────────────┐
                │    API Gateway           │
                │    FastAPI (Python)      │
                │    /api/v1/*             │
                └──────┬───────────────────┘
                       │
     ┌─────────────────┼──────────────────────────────┐
     │                 │                              │
┌────▼───────┐  ┌──────▼──────────┐  ┌───────────────▼───────────┐
│   Auth     │  │  Finance        │  │      AI Service            │
│  Service   │  │  Service        │  │   (app/services/           │
│            │  │                 │  │    ai_service.py)          │
│ JWT issue  │  │ transactions    │  │                           │
│ refresh    │  │ categories      │  │  ┌──────────────────────┐ │
│ biometric  │  │ budgets         │  │  │  Budget Advisor      │ │
│ verify     │  │ goals           │  │  │  income + expenses   │ │
└────────────┘  │ reports         │  │  │  + goals + location  │ │
                └─────────────────┘  │  │  → Gemini Flash      │ │
                                     │  │  → budget plan JSON  │ │
┌────────────────────────┐           │  └──────────────────────┘ │
│  Currency Service      │           │  ┌──────────────────────┐ │
│  - Fetch from OXR API  │           │  │  Spend Analyzer      │ │
│  - Cache in Redis 24h  │           │  │  pandas aggregations │ │
│  - Offline: last known │           │  │  → Gemini Flash      │ │
│    rates + warning     │           │  │  → plain English     │ │
└────────────────────────┘           │  │    insights          │ │
                                     │  └──────────────────────┘ │
┌────────────────────────┐           │  ┌──────────────────────┐ │
│  Sync Service          │           │  │  Investment          │ │
│  - Pull server changes │           │  │  Suggester           │ │
│  - Push dirty records  │           │  │  surplus + risk +    │ │
│  - Conflict resolution │           │  │  location            │ │
│    (last-write-wins)   │           │  │  → Gemini Flash      │ │
└────────────────────────┘           │  └──────────────────────┘ │
                                     │  ┌──────────────────────┐ │
                                     │  │  Voice Parser        │ │
                                     │  │  transcribed text    │ │
                                     │  │  → Gemini Flash      │ │
                                     │  │    (function calling)│ │
                                     │  │  → structured JSON   │ │
                                     │  └──────────────────────┘ │
                                     └───────────────────────────┘
                                                  │
                              ┌───────────────────┼──────────────┐
                              │                   │              │
                         PostgreSQL            Redis          S3/R2
                         (main data)      (cache + queue)  (receipts)

┌───────────────────────────────────────────────┐
│         Celery Workers (Async)                │
│  - Weekly/monthly AI analysis (scheduled)     │
│  - Currency rate refresh (daily)              │
│  - Push notification dispatch                 │
│  - PDF/CSV report generation                  │
└───────────────────────────────────────────────┘
```

---

## Offline-to-Online Sync

### Strategy
1. All writes hit WatermelonDB (SQLite) first — always instant
2. Every record carries `is_synced: boolean` and `updated_at: timestamp`
3. On app foreground or network reconnect, sync engine fires
4. Engine pushes dirty records to `POST /api/v1/sync/push`
5. Engine pulls server-side changes from `GET /api/v1/sync/pull?since={timestamp}`
6. Conflict resolution: last-write-wins on `updated_at`

### Sync Endpoint Contract
```
POST /api/v1/sync
Body: {
  last_pulled_at: number,
  changes: {
    transactions: { created: [], updated: [], deleted: [] },
    categories:   { created: [], updated: [], deleted: [] },
    budgets:      { created: [], updated: [], deleted: [] },
    goals:        { created: [], updated: [], deleted: [] }
  }
}

Response: {
  changes: { ... same shape ... },
  timestamp: number
}
```

### Currency Offline Behaviour
- Rates refreshed from Open Exchange Rates API every 24h and stored in Redis
- Rates also cached in WatermelonDB for offline use
- If offline beyond 24h: last known rates used, UI shows staleness badge
- All amounts stored in both original currency and user's base currency

---

## AI Data Flow

### Voice Expense Entry
```
User speaks
  → Expo Speech (on-device) or Groq Whisper (cloud)
  → Raw transcript text
  → POST /api/v1/ai/parse-voice { text, base_currency }
  → Gemini 1.5 Flash (function calling)
  → { amount, currency, category, description, date }
  → Pre-filled form on mobile
  → User confirms → saved to WatermelonDB
```

### Budget Advice (monthly)
```
Celery scheduled task (1st of each month)
  → Aggregate last 3 months via pandas
  → POST to Gemini: income + category totals + goals + location
  → Structured budget recommendation JSON
  → Stored in PostgreSQL
  → Push notification to user
  → Shown in Insights tab
```

### Investment Suggestions
```
Triggered when: monthly surplus > 0 OR user taps "Suggest investments"
  → Collect: surplus amount, risk tolerance, location, existing goals
  → POST to Gemini with system prompt (investment knowledge base)
  → Returns: ranked list of options with explanation and expected return
```

---

## Database Schema (Summary)

| Table | Key Columns |
|-------|-------------|
| `users` | id, email, name, base_currency, location, risk_tolerance |
| `transactions` | id, user_id, type, amount, currency, base_amount, category_id, description, transaction_date |
| `categories` | id, user_id, name, icon, color, type, frequency, is_default |
| `budgets` | id, user_id, category_id, amount, currency, period, is_active |
| `goals` | id, user_id, name, target_amount, current_amount, deadline, type |
| `income_sources` | id, user_id, name, amount, currency, frequency |
| `ai_insights` | id, user_id, type, content, period, created_at |
| `exchange_rates` | base_currency, rates (JSONB), fetched_at |
