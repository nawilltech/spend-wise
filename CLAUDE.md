# SpendWise — Project Rules & Conventions

## Monorepo Layout
```
spending-advisor/
├── apps/mobile/     # React Native + Expo (Expo Router)
├── apps/api/        # FastAPI Python backend
├── docs/            # All project documentation
└── .github/         # CI/CD workflows
```

## Naming Conventions

### TypeScript / React Native
| Thing | Convention | Example |
|-------|-----------|---------|
| Component files | PascalCase | `Button.tsx`, `TransactionItem.tsx` |
| Non-component files | camelCase | `useAuth.ts`, `colors.ts`, `client.ts` |
| Hooks | `use` prefix + camelCase | `useAuth`, `useTransactions` |
| Stores | camelCase + `.store.ts` | `auth.store.ts` |
| Types / Interfaces | PascalCase | `Transaction`, `BudgetCategory` |
| Props interfaces | `ComponentProps` suffix | `ButtonProps`, `TransactionItemProps` |
| Constant values | SCREAMING_SNAKE_CASE | `PRIMARY_COLOR`, `API_BASE_URL` |
| Functions / variables | camelCase | `formatCurrency()`, `userId` |
| Barrel exports | `index.ts` in every folder | `export * from './Button'` |

### Python / FastAPI
| Thing | Convention | Example |
|-------|-----------|---------|
| Files | snake_case | `auth_service.py`, `transaction.py` |
| Classes | PascalCase | `UserModel`, `TransactionService` |
| Functions | snake_case | `get_current_user()`, `create_transaction()` |
| Variables | snake_case | `access_token`, `user_id` |
| Constants | SCREAMING_SNAKE_CASE | `JWT_SECRET`, `REDIS_URL` |
| Pydantic schemas | PascalCase + verb suffix | `TransactionCreate`, `UserResponse`, `BudgetUpdate` |
| SQLAlchemy models | PascalCase singular | `User`, `Transaction`, `Category` |

### Database
| Thing | Convention | Example |
|-------|-----------|---------|
| Table names | snake_case plural | `transactions`, `spending_categories` |
| Column names | snake_case | `created_at`, `user_id`, `base_amount` |
| Foreign keys | `{table_singular}_id` | `user_id`, `category_id` |
| Indexes | `ix_{table}_{column}` | `ix_transactions_user_id` |

### API Routes
- Pattern: `/api/v1/{resource}` — plural, kebab-case
- `GET    /api/v1/transactions`       — list
- `GET    /api/v1/transactions/{id}`  — single
- `POST   /api/v1/transactions`       — create
- `PATCH  /api/v1/transactions/{id}`  — partial update
- `DELETE /api/v1/transactions/{id}`  — delete

### Git
- Branch names: `feat/`, `fix/`, `chore/`, `docs/` + kebab-case  
  e.g. `feat/voice-expense-input`, `fix/sync-conflict-resolution`
- Commit style: Conventional Commits  
  e.g. `feat: add voice expense entry`, `fix: handle offline sync queue`

### Environment Variables
- SCREAMING_SNAKE_CASE
- No prefix needed — scoped per service `.env` file
- Always add to `.env.example` before use

## Code Rules

### General
- No `any` types in TypeScript — use proper types or `unknown`
- No unused imports
- All API calls go through `src/services/api/client.ts` — never raw fetch/axios elsewhere
- All WatermelonDB queries go through model classes — no raw SQL
- All AI calls go through `app/services/ai_service.py` — never inline

### Mobile
- All screens live under `app/` (Expo Router file-based routing)
- All reusable UI lives under `src/components/`
- Business logic lives in `src/hooks/` — keep screens thin
- Offline-first: always write to WatermelonDB first, then sync

### API
- All routes use dependency injection for DB session and current user
- All responses use Pydantic schemas — never return raw ORM objects
- Background tasks (AI analysis, reports) go through Celery workers
- Currency rates always read from Redis cache — never fetch inline in a request

## Folder-by-folder Index
| Path | Purpose |
|------|---------|
| `apps/mobile/app/` | Expo Router screens (file-based routing) |
| `apps/mobile/src/components/` | Reusable UI components |
| `apps/mobile/src/db/` | WatermelonDB schema, models, sync engine |
| `apps/mobile/src/hooks/` | Custom React hooks (business logic) |
| `apps/mobile/src/services/` | API client + external service calls |
| `apps/mobile/src/store/` | Zustand global state |
| `apps/mobile/src/constants/` | Colors, categories, currencies |
| `apps/mobile/src/types/` | Shared TypeScript types |
| `apps/mobile/src/utils/` | Pure utility functions |
| `apps/api/app/routers/` | FastAPI route handlers |
| `apps/api/app/models/` | SQLAlchemy ORM models |
| `apps/api/app/schemas/` | Pydantic request/response schemas |
| `apps/api/app/services/` | Business logic services |
| `apps/api/app/workers/` | Celery async tasks |
