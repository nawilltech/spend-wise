export interface DefaultCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
}

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { id: 'food',          name: 'Food & Groceries', icon: '🛒', color: '#F59E0B', type: 'expense' },
  { id: 'transport',     name: 'Transport',        icon: '🚗', color: '#3B82F6', type: 'expense' },
  { id: 'housing',       name: 'Housing & Rent',   icon: '🏠', color: '#8B5CF6', type: 'expense' },
  { id: 'utilities',     name: 'Utilities',        icon: '💡', color: '#F97316', type: 'expense' },
  { id: 'health',        name: 'Health',           icon: '🏥', color: '#EF4444', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment',    icon: '🎬', color: '#EC4899', type: 'expense' },
  { id: 'data',          name: 'Data & Internet',  icon: '📱', color: '#14B8A6', type: 'expense' },
  { id: 'clothing',      name: 'Clothing',         icon: '👕', color: '#6366F1', type: 'expense' },
  { id: 'education',     name: 'Education',        icon: '📚', color: '#0EA5E9', type: 'expense' },
  { id: 'savings',       name: 'Savings',          icon: '🏦', color: '#10B981', type: 'expense' },
  { id: 'investment',    name: 'Investment',       icon: '📈', color: '#0F4C75', type: 'expense' },
  { id: 'misc',          name: 'Miscellaneous',    icon: '📦', color: '#94A3B8', type: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { id: 'salary',     name: 'Salary',          icon: '💼', color: '#10B981', type: 'income' },
  { id: 'freelance',  name: 'Freelance',       icon: '💻', color: '#0F4C75', type: 'income' },
  { id: 'rental',     name: 'Rental Income',   icon: '🏘️',  color: '#8B5CF6', type: 'income' },
  { id: 'dividends',  name: 'Dividends',       icon: '📊', color: '#F59E0B', type: 'income' },
  { id: 'gift',       name: 'Gift / Transfer', icon: '🎁', color: '#EC4899', type: 'income' },
  { id: 'other_inc',  name: 'Other Income',    icon: '💰', color: '#94A3B8', type: 'income' },
];

export const ALL_DEFAULT_CATEGORIES = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];
