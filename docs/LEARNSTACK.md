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

## FastAPI

### What it is
A modern Python web framework for building APIs. Async by default. Generates OpenAPI docs automatically.

### Key patterns used in this project
```python
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.models.user import User

app = FastAPI()

@app.post("/api/v1/transactions", response_model=TransactionResponse, status_code=201)
async def create_transaction(
    body: TransactionCreate,           # auto-validated by Pydantic
    db: AsyncSession = Depends(get_db),        # injected DB session
    user: User = Depends(get_current_user),    # injected from JWT
):
    # body is already validated — no manual checks needed
    transaction = await transaction_service.create(db, user.id, body)
    return transaction  # auto-serialised by response_model
```

### Dependency injection
```python
# Dependencies are reusable, testable, composable
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await auth_service.verify_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
```

### Async database pattern
```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

engine = create_async_engine(settings.DATABASE_URL)

async def get_db():
    async with AsyncSession(engine) as session:
        yield session  # FastAPI closes session after request
```

---

## SQLAlchemy 2.0 (ORM)

### Model definition
```python
from sqlalchemy import String, Numeric, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import uuid, enum

class TransactionType(str, enum.Enum):
    income  = "income"
    expense = "expense"

class Transaction(Base):
    __tablename__ = "transactions"

    id:          Mapped[str]   = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id:     Mapped[str]   = mapped_column(ForeignKey("users.id"), index=True)
    amount:      Mapped[float] = mapped_column(Numeric(12, 2))
    currency:    Mapped[str]   = mapped_column(String(3))
    type:        Mapped[TransactionType]

    user: Mapped["User"] = relationship(back_populates="transactions")
```

### Async queries
```python
from sqlalchemy import select

async def get_user_transactions(db: AsyncSession, user_id: str):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()
```

---

## Celery (Async Tasks)

### What it is
Runs tasks outside the HTTP request cycle. Scheduled (cron) and on-demand.

```python
# workers/tasks.py
from app.workers.celery_app import celery_app

@celery_app.task
def generate_monthly_report(user_id: str):
    # This runs in a worker process, not in the API
    data = analysis_service.aggregate_month(user_id)
    insight = ai_service.generate_insights(data)
    # save to DB, send push notification
```

```python
# Schedule in celery_app.py
celery_app.conf.beat_schedule = {
    'monthly-reports': {
        'task': 'app.workers.tasks.generate_monthly_reports_all',
        'schedule': crontab(day_of_month=1, hour=8),  # 1st of each month
    },
}
```

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
