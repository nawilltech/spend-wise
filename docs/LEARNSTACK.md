# Learn the Stack — SpendWise

A practical primer on each technology used in this project. Read before you write code.

---

## React Native

### What it is
React Native lets you build native iOS and Android apps using JavaScript/TypeScript and React. Your components compile to real native views — not a WebView.

### Key concepts
```tsx
// Components — the building block of every screen
export function TransactionItem({ amount, category }: TransactionItemProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.amount}>{amount}</Text>
      <Text style={styles.category}>{category}</Text>
    </View>
  );
}

// StyleSheet — like CSS but as a JS object, optimised by the native bridge
const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 16 },
  amount:    { fontSize: 18, fontWeight: '600' },
  category:  { color: '#64748B' },
});
```

### Key differences from web React
- No `div`, `span`, `p` — use `View`, `Text`, `ScrollView`, `FlatList`
- No CSS files — all styles are inline JS objects via `StyleSheet`
- `FlatList` instead of `.map()` for lists (virtualised for performance)
- `TouchableOpacity` / `Pressable` instead of `<button>`
- Navigation handled by a library (Expo Router in this project)

### Expo adds
- Pre-built access to camera, speech, notifications, biometrics, secure storage
- OTA (over-the-air) updates without App Store review
- `npx expo start` to run on device via QR code

---

## Expo Router

### What it is
File-based routing for React Native. The file path under `app/` becomes the route.

### Structure in this project
```
app/
├── _layout.tsx           ← root layout (auth guard lives here)
├── (auth)/
│   ├── _layout.tsx       ← auth stack layout
│   ├── login.tsx         ← route: /login
│   └── register.tsx      ← route: /register
└── (tabs)/
    ├── _layout.tsx        ← tab bar layout
    ├── index.tsx          ← route: / (Dashboard)
    ├── transactions.tsx   ← route: /transactions
    └── settings.tsx       ← route: /settings
```

### Navigation
```tsx
import { router } from 'expo-router';

// Navigate
router.push('/transactions');
router.replace('/(auth)/login');  // replace history (no back)
router.back();

// Link component
import { Link } from 'expo-router';
<Link href="/transactions">View all</Link>
```

### Auth guard (root _layout.tsx)
```tsx
export default function RootLayout() {
  const { token } = useAuthStore();
  return (
    <Stack>
      {token ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
```

---

## WatermelonDB

### What it is
An offline-first reactive database for React Native built on SQLite. Records are observable — UI re-renders automatically when data changes.

### Core concepts

**Schema** — defines tables and columns upfront:
```typescript
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'amount',      type: 'number' },
        { name: 'currency',    type: 'string' },
        { name: 'category_id', type: 'string', isIndexed: true },
        { name: 'is_synced',   type: 'boolean' },
        { name: 'created_at',  type: 'number' },
      ],
    }),
  ],
});
```

**Model** — a class per table:
```typescript
import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Transaction extends Model {
  static table = 'transactions';

  @field('amount')      amount!: number;
  @field('currency')    currency!: string;
  @field('is_synced')   isSynced!: boolean;
  @readonly @date('created_at') createdAt!: Date;
}
```

**Queries** — observable, reactive:
```typescript
// In a component (re-renders on data change)
const transactions = await database
  .collections.get<Transaction>('transactions')
  .query(Q.where('is_synced', false))
  .fetch();
```

**Writes** — always wrapped in actions:
```typescript
await database.write(async () => {
  await database.collections.get('transactions').create(record => {
    record.amount = 5000;
    record.currency = 'NGN';
    record.isSynced = false;
  });
});
```

---

## Zustand

### What it is
A minimal state management library. Think Redux without the boilerplate.

### Pattern used in this project
```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => SecureStore), // encrypted on device
    }
  )
);

// Usage in any component
const { token, logout } = useAuthStore();
```

---

## FastAPI — A Guide for NestJS / Prisma Developers

FastAPI maps closely to the patterns you already know. The table below is your Rosetta Stone:

| NestJS / Prisma / TypeORM | FastAPI / SQLAlchemy / Celery |
|---------------------------|-------------------------------|
| `@Controller('/transactions')` | `APIRouter(prefix='/transactions')` |
| `@Get()`, `@Post()`, `@Patch()`, `@Delete()` | `@router.get()`, `@router.post()`, etc. |
| `@Injectable()` service class | Plain Python module with `async def` functions |
| `@Module({ imports, controllers, providers })` | `app.include_router(router, prefix=...)` |
| `@UseGuards(JwtAuthGuard)` | `user: User = Depends(get_current_user)` |
| DTO + `class-validator` decorators | Pydantic model (`BaseModel`) |
| Prisma model (`schema.prisma`) | SQLAlchemy model (`Mapped[...]`) |
| `prisma.transaction.findMany(where: {...})` | `select(Transaction).where(...)` |
| `prisma.$transaction([...])` | `async with session.begin(): ...` |
| TypeORM `QueryBuilder` | SQLAlchemy chained `select()` |
| Alembic (same name!) | Alembic (same tool — Prisma migrate ≈ `alembic upgrade head`) |
| `@nestjs/schedule` `@Cron(...)` | Celery beat `crontab(...)` |
| `@nestjs/bull` task queue | Celery worker + Redis broker |
| `ConfigService` / `.env` | `pydantic-settings` `BaseSettings` |
| `ValidationPipe` (global) | Pydantic — always on, no setup needed |
| Exception filter | `@app.exception_handler(...)` |

---

### 1. Project structure — Controllers → Routers, Services stay the same

In NestJS you have a module with a controller and a service. In FastAPI the same split exists but without the class ceremony:

```
NestJS                          FastAPI
──────────────────────────────  ──────────────────────────────
transactions/                   app/
  transactions.module.ts           routers/
  transactions.controller.ts         transactions.py   ← router = controller
  transactions.service.ts          services/
  dto/                               transaction_service.py
    create-transaction.dto.ts      schemas/
    update-transaction.dto.ts        transaction.py    ← DTOs = Pydantic schemas
```

```python
# app/routers/transactions.py  ← equivalent to a NestJS controller

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.services import transaction_service
from app.models.user import User

router = APIRouter()  # equivalent to @Controller()

@router.get("/", response_model=list[TransactionResponse])
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await transaction_service.get_all(db, user.id)

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tx = await transaction_service.get_one(db, transaction_id, user.id)
    if not tx:
        raise HTTPException(status_code=404, detail="Not found")
    return tx

@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    body: TransactionCreate,                        # Pydantic validates automatically
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await transaction_service.create(db, user.id, body)

@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    body: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tx = await transaction_service.update(db, transaction_id, user.id, body)
    if not tx:
        raise HTTPException(status_code=404, detail="Not found")
    return tx

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    deleted = await transaction_service.delete(db, transaction_id, user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")
```

Register in `main.py` — same as `@Module({ imports: [TransactionsModule] })`:

```python
# app/main.py
app.include_router(transactions.router, prefix="/api/v1/transactions", tags=["transactions"])
```

---

### 2. DTOs / Validation — class-validator → Pydantic

NestJS uses `class-validator` decorators. Pydantic does the same with type annotations — no decorators, no `ValidationPipe` setup needed.

```typescript
// NestJS DTO
import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export class CreateTransactionDto {
  @IsNumber() @Min(0)
  amount: number;

  @IsString()
  currency: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional() @IsString()
  description?: string;
}
```

```python
# FastAPI — app/schemas/transaction.py
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum
from datetime import datetime

class TransactionType(str, Enum):
    income  = "income"
    expense = "expense"

class TransactionCreate(BaseModel):              # ← CreateTransactionDto
    amount: float = Field(gt=0)                  # gt=0 ≈ @Min(0)
    currency: str = Field(min_length=3, max_length=3)
    type: TransactionType
    description: Optional[str] = None            # @IsOptional()
    category_id: Optional[str] = None

    @field_validator("currency")                 # custom validator
    @classmethod
    def uppercase_currency(cls, v: str) -> str:
        return v.upper()

class TransactionUpdate(BaseModel):              # all fields optional for PATCH
    amount: Optional[float] = Field(default=None, gt=0)
    description: Optional[str] = None
    category_id: Optional[str] = None

class TransactionResponse(BaseModel):            # what the API returns
    id: str
    amount: float
    currency: str
    type: TransactionType
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}     # ← allows ORM model → Pydantic
```

The `model_config = {"from_attributes": True}` is the Pydantic v2 equivalent of NestJS's `plainToClass` — it lets you pass a SQLAlchemy ORM object directly and Pydantic serialises it.

---

### 3. Dependency Injection — `@Injectable()` → `Depends()`

NestJS DI is class-based with decorators. FastAPI DI is function-based — cleaner, no class needed.

```typescript
// NestJS guard
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  canActivate(ctx: ExecutionContext): boolean {
    const token = ctx.switchToHttp().getRequest().headers.authorization;
    return this.jwtService.verify(token);
  }
}
```

```python
# FastAPI dependency — app/dependencies.py
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services import auth_service

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),   # extracts Bearer token from header
    db: AsyncSession = Depends(get_db),
):
    user = await auth_service.verify_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user

# Compose dependencies — equivalent to extending a guard
async def get_admin_user(user = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user
```

Usage in a route:

```python
# Attach to a single route
@router.get("/admin/stats")
async def admin_stats(user = Depends(get_admin_user)):  ...

# Or attach to the whole router at registration time
app.include_router(admin_router, prefix="/admin", dependencies=[Depends(get_admin_user)])
```

---

### 4. SQLAlchemy Models — Prisma schema → Python classes

```prisma
// Prisma schema
model Transaction {
  id          String   @id @default(uuid())
  userId      String
  amount      Decimal
  currency    String
  type        TransactionType
  description String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}
```

```python
# SQLAlchemy 2.0 — app/models/transaction.py
from __future__ import annotations
from sqlalchemy import String, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from app.database import Base
import uuid

class Transaction(Base):
    __tablename__ = "transactions"

    id:          Mapped[str]             = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id:     Mapped[str]             = mapped_column(ForeignKey("users.id"), index=True)
    amount:      Mapped[float]           = mapped_column(Numeric(12, 2))
    currency:    Mapped[str]             = mapped_column(String(3))
    type:        Mapped[str]             = mapped_column(String(10))
    description: Mapped[Optional[str]]   = mapped_column(String(500), nullable=True)
    created_at:  Mapped[datetime]        = mapped_column(server_default=func.now())

    # Relationship — equivalent to Prisma's @relation
    user: Mapped["User"] = relationship(back_populates="transactions")
```

**Key differences from Prisma:**
- No schema file — models are Python classes in `app/models/`
- `Mapped[Optional[str]]` = nullable field (Prisma's `String?`)
- `ForeignKey("users.id")` is explicit (Prisma infers it from `@relation`)
- Relationships use `relationship()`, not decorators

---

### 5. CRUD Service — Prisma client → SQLAlchemy async session

```typescript
// NestJS service with Prisma
async create(userId: string, dto: CreateTransactionDto) {
  return this.prisma.transaction.create({
    data: { ...dto, userId },
  });
}

async findAll(userId: string) {
  return this.prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

async update(id: string, dto: UpdateTransactionDto) {
  return this.prisma.transaction.update({
    where: { id },
    data: dto,
  });
}
```

```python
# FastAPI service — app/services/transaction_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionUpdate

async def get_all(db: AsyncSession, user_id: str) -> list[Transaction]:
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)   # prisma: where: { userId }
        .order_by(Transaction.created_at.desc())  # prisma: orderBy: { createdAt: 'desc' }
    )
    return result.scalars().all()

async def get_one(db: AsyncSession, tx_id: str, user_id: str) -> Transaction | None:
    result = await db.execute(
        select(Transaction).where(
            Transaction.id == tx_id,
            Transaction.user_id == user_id,       # ownership check
        )
    )
    return result.scalar_one_or_none()            # prisma: findUnique → None if not found

async def create(db: AsyncSession, user_id: str, data: TransactionCreate) -> Transaction:
    tx = Transaction(
        user_id=user_id,
        **data.model_dump(),                      # prisma: { ...dto, userId }
    )
    db.add(tx)
    await db.flush()         # write to DB but don't commit yet (session commits in get_db)
    await db.refresh(tx)     # reload to get server-generated fields (id, created_at)
    return tx

async def update(db: AsyncSession, tx_id: str, user_id: str, data: TransactionUpdate) -> Transaction | None:
    tx = await get_one(db, tx_id, user_id)
    if not tx:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():  # exclude_unset = PATCH semantics
        setattr(tx, field, value)
    await db.flush()
    await db.refresh(tx)
    return tx

async def delete(db: AsyncSession, tx_id: str, user_id: str) -> bool:
    tx = await get_one(db, tx_id, user_id)
    if not tx:
        return False
    await db.delete(tx)
    return True
```

`exclude_unset=True` in `model_dump()` is the key to clean PATCH behaviour — only fields the client actually sent are updated, identical to how Prisma handles partial updates.

---

### 6. DB Transactions — `prisma.$transaction()` → `session.begin()`

When you need multiple writes to succeed or fail together:

```typescript
// Prisma
await prisma.$transaction(async (tx) => {
  const transaction = await tx.transaction.create({ data: txData });
  await tx.budget.update({ where: { id }, data: { spent: { increment: amount } } });
  return transaction;
});
```

```python
# SQLAlchemy — option 1: explicit begin/rollback (most explicit)
async def create_with_budget_update(db: AsyncSession, user_id: str, data: TransactionCreate):
    async with db.begin():                        # prisma.$transaction(async tx => {
        tx = Transaction(user_id=user_id, **data.model_dump())
        db.add(tx)
        await db.flush()

        # update related budget in the same transaction
        budget = await db.get(Budget, data.category_id)
        if budget:
            budget.spent += data.amount

    # commit happens automatically when the `async with` block exits cleanly
    # rollback happens automatically on any exception
    return tx
```

```python
# Option 2: savepoints (nested transactions — equivalent to Prisma's nested writes)
async def transfer_funds(db: AsyncSession, from_id: str, to_id: str, amount: float):
    async with db.begin_nested():                 # creates a SAVEPOINT
        source = await db.get(Account, from_id)
        source.balance -= amount

        async with db.begin_nested():             # nested savepoint
            dest = await db.get(Account, to_id)
            dest.balance += amount
```

The session in `get_db()` auto-commits at the end of each successful request and rolls back on exceptions — so for single-route writes you don't need explicit `begin()` at all.

---

### 7. DB Queries — Prisma where clauses → SQLAlchemy expressions

```typescript
// Prisma queries                              // SQLAlchemy equivalent
prisma.transaction.findMany({
  where: {
    userId: id,                                // .where(Transaction.user_id == id)
    amount: { gte: 100 },                     // .where(Transaction.amount >= 100)
    type: 'expense',                           // .where(Transaction.type == 'expense')
    createdAt: { gte: startDate },            // .where(Transaction.created_at >= start)
  },
  orderBy: { createdAt: 'desc' },             // .order_by(Transaction.created_at.desc())
  take: 20,                                   // .limit(20)
  skip: 40,                                   // .offset(40)
  include: { category: true },               // joinedload / selectinload (see below)
})
```

```python
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload, joinedload
from datetime import datetime

async def query_transactions(
    db: AsyncSession,
    user_id: str,
    type: str | None = None,
    min_amount: float | None = None,
    start_date: datetime | None = None,
    page: int = 1,
    per_page: int = 20,
) -> list[Transaction]:

    stmt = (
        select(Transaction)
        .where(Transaction.user_id == user_id)      # required filter
    )

    # conditional filters — equivalent to Prisma's optional where clauses
    if type:
        stmt = stmt.where(Transaction.type == type)
    if min_amount is not None:
        stmt = stmt.where(Transaction.amount >= min_amount)
    if start_date:
        stmt = stmt.where(Transaction.created_at >= start_date)

    stmt = (
        stmt
        .order_by(Transaction.created_at.desc())
        .limit(per_page)
        .offset((page - 1) * per_page)
        .options(selectinload(Transaction.category))  # prisma: include: { category: true }
    )

    result = await db.execute(stmt)
    return result.scalars().all()
```

**Aggregation** — equivalent to Prisma `groupBy` / `_sum`:

```python
from sqlalchemy import select, func, case, extract

async def monthly_summary(db: AsyncSession, user_id: str, year: int, month: int):
    result = await db.execute(
        select(
            func.sum(
                case((Transaction.type == "income", Transaction.amount), else_=0)
            ).label("total_income"),
            func.sum(
                case((Transaction.type == "expense", Transaction.amount), else_=0)
            ).label("total_expenses"),
            func.count(Transaction.id).label("count"),
        )
        .where(
            Transaction.user_id == user_id,
            extract("year",  Transaction.created_at) == year,
            extract("month", Transaction.created_at) == month,
        )
    )
    return result.mappings().one()   # returns dict-like: row["total_income"]
```

**Group by category** — Prisma `groupBy`:

```python
async def spending_by_category(db: AsyncSession, user_id: str) -> list[dict]:
    result = await db.execute(
        select(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .where(Transaction.user_id == user_id, Transaction.type == "expense")
        .group_by(Transaction.category_id)
        .order_by(func.sum(Transaction.amount).desc())
    )
    return result.mappings().all()
```

---

### 8. Migrations — Prisma Migrate → Alembic

```bash
# Prisma                            # Alembic (same concepts)
npx prisma migrate dev             make migrate-create name=add_tags_column
npx prisma migrate deploy          make migrate          (= alembic upgrade head)
npx prisma migrate status          alembic current
npx prisma db seed                 (manual script in scripts/seed.py)
```

Alembic auto-generates migration files from your SQLAlchemy model changes:

```python
# alembic/versions/20240501_add_tags.py  — auto-generated, you edit if needed
def upgrade() -> None:
    op.add_column("transactions", sa.Column("tags", sa.String(200), nullable=True))

def downgrade() -> None:
    op.drop_column("transactions", "tags")
```

---

### 9. Cron Jobs — `@nestjs/schedule` → Celery beat

```typescript
// NestJS
@Injectable()
export class ReportScheduler {
  @Cron('0 8 1 * *')  // 8am on the 1st of every month
  async generateMonthlyReports() {
    await this.reportService.generateAll();
  }
}
```

```python
# Celery — app/workers/celery_app.py
from celery import Celery
from celery.schedules import crontab

celery_app = Celery("spendwise", broker=settings.redis_url, backend=settings.redis_url)

celery_app.conf.beat_schedule = {
    "monthly-reports": {
        "task": "app.workers.tasks.generate_monthly_reports_all",
        "schedule": crontab(hour=8, minute=0, day_of_month=1),  # same as @Cron
    },
    "daily-currency-refresh": {
        "task": "app.workers.tasks.refresh_exchange_rates",
        "schedule": crontab(hour=0, minute=0),                  # midnight daily
    },
}
```

```python
# app/workers/tasks.py
from app.workers.celery_app import celery_app
from app.database import AsyncSessionLocal
from app.services import report_service

@celery_app.task(bind=True, max_retries=3)
def generate_monthly_reports_all(self):
    import asyncio
    asyncio.run(_run())

async def _run():
    async with AsyncSessionLocal() as db:
        await report_service.generate_all(db)
```

**Trigger a task from a route** (equivalent to `@nestjs/bull` enqueue):

```python
# Fire and forget from a route handler
@router.post("/{id}/analyse")
async def trigger_analysis(id: str, user = Depends(get_current_user)):
    from app.workers.tasks import analyse_spending
    analyse_spending.delay(user.id)          # .delay() = enqueue, returns immediately
    return {"status": "queued"}

# With result tracking
task = analyse_spending.apply_async(args=[user.id], countdown=5)  # run after 5s
return {"task_id": task.id}

# Check status
result = celery_app.AsyncResult(task_id)
return {"status": result.status, "result": result.result}
```

---

### 10. Error Handling — Exception filters → exception handlers

```typescript
// NestJS global exception filter
@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    if (exception.code === 'P2002') {
      throw new ConflictException('Already exists');
    }
  }
}
```

```python
# FastAPI — app/main.py
from fastapi import Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

@app.exception_handler(IntegrityError)        # ← equivalent to @Catch(PrismaClientKnownRequestError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={"detail": "Resource already exists"},
    )

# Raising errors inside routes/services — same as NestJS
raise HTTPException(status_code=404, detail="Transaction not found")
raise HTTPException(status_code=403, detail="Not your resource")
raise HTTPException(status_code=422, detail=[{"field": "amount", "msg": "must be > 0"}])
```

---

### 11. Config / Environment — `ConfigService` → `pydantic-settings`

```typescript
// NestJS
@Injectable()
export class AppService {
  constructor(private config: ConfigService) {}
  getUrl() { return this.config.get<string>('DATABASE_URL'); }
}
```

```python
# pydantic-settings — app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://..."
    secret_key: str = "change-me"
    gemini_api_key: str = ""

    class Config:
        env_file = ".env"

settings = Settings()          # singleton — import and use anywhere
print(settings.database_url)   # no ConfigService.get() needed
```

---

### 12. Testing — Jest → pytest

```typescript
// NestJS test
describe('TransactionsService', () => {
  it('should create a transaction', async () => {
    const result = await service.create(userId, dto);
    expect(result.amount).toBe(dto.amount);
  });
});
```

```python
# pytest — tests/test_transactions.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_transaction(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/transactions",
        json={"amount": 5000, "currency": "NGN", "type": "expense", "category_id": "food"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["amount"] == 5000

@pytest.mark.asyncio
async def test_create_transaction_invalid_amount(client: AsyncClient, auth_headers: dict):
    response = await client.post(
        "/api/v1/transactions",
        json={"amount": -100, "currency": "NGN", "type": "expense"},
        headers=auth_headers,
    )
    assert response.status_code == 422              # Pydantic validation error
```

Run with: `make test-api`

The auto-generated interactive docs at `http://localhost:8000/docs` let you test every endpoint in the browser — no Postman needed during development.

---

## Celery (Async Tasks)

---

## Google Gemini API

### Setup
```python
import google.generativeai as genai
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')
```

### Text generation
```python
response = model.generate_content("Analyse this spending: ...")
print(response.text)
```

### Function calling (structured output — used for voice parsing)
```python
parse_expense_fn = genai.protos.FunctionDeclaration(
    name="parse_expense",
    description="Extract structured expense details from text",
    parameters=genai.protos.Schema(
        type=genai.protos.Type.OBJECT,
        properties={
            "amount":      genai.protos.Schema(type=genai.protos.Type.NUMBER),
            "currency":    genai.protos.Schema(type=genai.protos.Type.STRING),
            "category":    genai.protos.Schema(type=genai.protos.Type.STRING),
            "description": genai.protos.Schema(type=genai.protos.Type.STRING),
        },
        required=["amount", "currency", "category"],
    ),
)

response = model.generate_content(
    f'Extract expense: "spent 3500 naira on groceries"',
    tools=[genai.protos.Tool(function_declarations=[parse_expense_fn])],
)
# response.candidates[0].content.parts[0].function_call.args
```

---

## Key Concepts Glossary

| Term | Meaning |
|------|---------|
| Offline-first | App works fully without internet; data syncs when online |
| WatermelonDB sync | Push local dirty records → pull server changes → mark synced |
| JWT | JSON Web Token — stateless auth token sent in `Authorization: Bearer` header |
| Pydantic | Python library that validates data using type annotations |
| Dependency injection | FastAPI pattern: functions that provide resources (DB, user) to route handlers |
| Celery beat | Celery's scheduler for cron-style recurring tasks |
| Exchange rate caching | Rates fetched once per 24h, stored in Redis and WatermelonDB |
| Function calling | LLM feature: model returns structured JSON instead of text |
