import { formatDate } from '@/lib/utils';
import { getCurrencySymbol } from '@/constants/currencies';
import type { TransactionType } from '@/types';

interface TransactionItemProps {
  type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  categoryName: string;
  categoryIcon: string;
  date: Date;
}

export function TransactionItem({ type, amount, currency, description, categoryName, categoryIcon, date }: TransactionItemProps) {
  const symbol = getCurrencySymbol(currency);
  const isIncome = type === 'income';

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-lg flex-shrink-0">
        {categoryIcon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{description || categoryName}</p>
        <p className="text-xs text-text-muted">{categoryName} · {formatDate(date)}</p>
      </div>
      <span className={`text-sm font-semibold ${isIncome ? 'text-income' : 'text-expense'}`}>
        {isIncome ? '+' : '-'}{symbol}{amount.toLocaleString()}
      </span>
    </div>
  );
}
