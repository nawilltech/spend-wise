// ── Auth ─────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  baseCurrency: string;
  location: string;
  riskTolerance: 'low' | 'medium' | 'high';
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
  categoryId: string;
  description: string;
  note?: string;
  voiceInput?: string;
  transactionDate: string;
  isSynced: boolean;
  createdAt: string;
}

export interface TransactionCreate {
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: string;
  description: string;
  note?: string;
  transactionDate: string;
}

// ── Categories ───────────────────────────────────────────────────────
export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | 'both';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  isDefault: boolean;
}

// ── Budgets ──────────────────────────────────────────────────────────
export type BudgetPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  isActive: boolean;
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
}

// ── AI ───────────────────────────────────────────────────────────────
export interface ParsedExpense {
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
}

export interface BudgetAdvice {
  allocations: Array<{
    category: string;
    percentage: number;
    amount: number;
    current: number;
  }>;
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

// ── Analytics ────────────────────────────────────────────────────────
export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface SpendingSummary {
  period: AnalyticsPeriod;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  byCategory: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
  }>;
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
