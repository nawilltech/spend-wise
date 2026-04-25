# SpendWise

> AI-powered personal finance advisor — track spending, get budget advice, and reach financial goals.

## What it does
- Track income and all spending categories with voice input
- AI-generated budget recommendations based on income, goals, and location
- Investment suggestions based on surplus and risk tolerance
- Daily, weekly, monthly, quarterly, and annual financial analysis
- Offline-first — works without internet, syncs when connected
- Multicurrency support with real-time exchange rates

## Monorepo Structure
```
spending-advisor/
├── apps/
│   ├── mobile/     # React Native + Expo (iOS & Android)
│   └── api/        # FastAPI Python backend
├── docs/           # Project documentation
└── .github/        # CI/CD workflows
```

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Expo CLI (`npm install -g expo-cli`)

### Run everything
```bash
make setup      # install all dependencies
make dev        # start both API and mobile in dev mode
```

### Run individually
```bash
make dev-api    # FastAPI on http://localhost:8000
make dev-mobile # Expo dev server
make docs       # open docs/
```

## Documentation
| Doc | Description |
|-----|-------------|
| [PRD](docs/PRD.md) | Full product requirements |
| [Architecture](docs/ARCHITECTURE.md) | System design & AI components |
| [Tech Stack](docs/TECHSTACK.md) | Technology choices & rationale |
| [Learn Stacks](docs/LEARNSTACK.md) | Fundamentals of each technology |
| [Deployment](docs/DEPLOYMENT.md) | Deployment options & guides |

## Tech Stack Summary
- **Mobile:** React Native, Expo, WatermelonDB, Zustand
- **Backend:** FastAPI (Python), PostgreSQL, Redis, Celery
- **AI:** Google Gemini 1.5 Flash, Groq Whisper
- **Currency:** Open Exchange Rates API

## Contributing
See [CLAUDE.md](CLAUDE.md) for naming conventions and code rules.
