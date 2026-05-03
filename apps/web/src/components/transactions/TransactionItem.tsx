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
  onEdit?: () => void;
  onDelete?: () => void;
}

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

export function TransactionItem({ type, amount, currency, description, categoryName, categoryIcon, date, onEdit, onDelete }: TransactionItemProps) {
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
      <span className={`text-sm font-semibold flex-shrink-0 ${isIncome ? 'text-income' : 'text-expense'}`}>
        {isIncome ? '+' : '-'}{symbol}{amount.toLocaleString()}
      </span>
      {(onEdit || onDelete) && (
        <div className="flex gap-1 flex-shrink-0">
          {onEdit && (
            <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-background text-primary" title="Edit">
              <EditIcon />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-background text-danger" title="Delete">
              <TrashIcon />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
