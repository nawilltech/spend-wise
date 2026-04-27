// ── Auth ─────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  baseCurrency: string;
  location: string;
  riskTolerance: 'low' | 'medium' | 'high';
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Transactions ─────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  baseAmount: number;
  baseCurrency: string;
  categoryId: string | null;
  description: string;
  note?: string | null;
  voiceInput?: string | null;
  idempotencyKey?: string | null;
  transactionDate: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreate {
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId?: string | null;
  description?: string;
  note?: string;
  idempotencyKey?: string;
  transactionDate?: string;
}

export interface TransactionUpdate {
  amount?: number;
  currency?: string;
  categoryId?: string | null;
  description?: string;
  note?: string;
  transactionDate?: string;
}

export interface BulkTransactionResponse {
  created: Transaction[];
  skipped: Transaction[];
  createdCount: number;
  skippedCount: number;
}

// ── Categories ───────────────────────────────────────────────────────
export type CategoryType = 'income' | 'expense' | 'both';
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  frequency?: FrequencyType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreate {
  name: string;
  icon?: string;
  color?: string;
  type: CategoryType;
  frequency?: FrequencyType;
}

// ── Budgets ──────────────────────────────────────────────────────────
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface BudgetCategory {
  id: string;
  name: string;
  type: CategoryType;
  frequency?: FrequencyType;
  icon: string;
  color: string;
}

export interface BudgetUser {
  id: string;
  name: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: BudgetUser;
  category: BudgetCategory;
}

export interface BudgetCreate {
  categoryId: string;
  amount: number;
  currency: string;
  period?: BudgetPeriod;
}

export interface BudgetWithSpent extends Budget {
  spent: number;
  remaining: number;
  percentUsed: number;
}

// ── Goals ────────────────────────────────────────────────────────────
export type GoalType = 'savings' | 'debt' | 'emergency' | 'investment' | 'custom';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline?: string;
  type: GoalType;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalCreate {
  name: string;
  targetAmount: number;
  currency: string;
  type: GoalType;
  deadline?: string;
}

// ── Analytics ────────────────────────────────────────────────────────
export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string | null;
  amount: number;
  count: number;
  percentage: number;
}

export interface ChartDataPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface TransactionAnalytics {
  period: AnalyticsPeriod;
  startDate: string;
  endDate: string;
  currency: string;
  totalVolume: number;
  entryCount: number;
  incomeCount: number;
  expenseCount: number;
  totalIncome: number;
  highestIncome: number | null;
  lowestIncome: number | null;
  averageIncome: number | null;
  totalExpense: number;
  highestExpense: number | null;
  lowestExpense: number | null;
  averageExpense: number | null;
  netSavings: number;
  savingsRate: number;
  categoryBreakdown: CategoryBreakdown[];
  chartData: ChartDataPoint[];
}

// ── AI ───────────────────────────────────────────────────────────────
export interface ParsedExpense {
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
}

export interface BudgetAllocation {
  category: string;
  percentage: number;
  amount: number;
  current: number;
}

export interface BudgetAdvice {
  allocations: BudgetAllocation[];
  insights: string[];
  actions: string[];
}

export interface InvestmentSuggestion {
  name: string;
  type: string;
  expectedReturn: string;
  riskLevel: 'low' | 'medium' | 'high';
  minimumAmount: number;
  description: string;
  platforms?: string[];
}

export interface InvestmentSuggestionsResponse {
  suggestions: InvestmentSuggestion[];
  monthlySurplus: number;
  currency: string;
}

// ── Currency ─────────────────────────────────────────────────────────
export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

// ── API ──────────────────────────────────────────────────────────────
export interface ApiError {
  detail: string;
  status: number;
}
