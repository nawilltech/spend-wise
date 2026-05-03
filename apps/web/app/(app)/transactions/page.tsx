'use client';

import { useState } from 'react';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useTransactions } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { useToastStore } from '@/store/toast.store';
import { getApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import type { Transaction, TransactionType } from '@/types';

type Filter = 'all' | TransactionType;
type ModalMode = { mode: 'create' } | { mode: 'edit'; tx: Transaction };

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Income', value: 'income' },
  { label: 'Expenses', value: 'expense' },
];

export default function TransactionsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToastStore();

  const { transactions, loading, refetch, create, update, remove } = useTransactions({
    limit: 100,
    type: filter === 'all' ? undefined : filter,
  });
  const { categories } = useCategories();
  const { budgets } = useBudgets();
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  async function handleCreate(payload: Parameters<typeof create>[0]) {
    await create(payload);
    await refetch();
  }

  async function handleUpdate(tx: Transaction, payload: Parameters<typeof create>[0]) {
    try {
      await update(tx.id, payload);
    } catch (err) {
      throw new Error(getApiError(err, 'Failed to update transaction'));
    }
  }

  async function handleDelete() {
    if (!deletingTx) return;
    setDeleteLoading(true);
    try {
      const ok = await remove(deletingTx.id);
      if (ok) {
        toast.success('Transaction deleted');
        setDeletingTx(null);
      } else {
        toast.error('Failed to delete transaction');
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              refetch(f.value === 'all' ? undefined : (f.value as TransactionType));
            }}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              filter === f.value
                ? 'bg-primary text-white border-primary'
                : 'bg-surface text-text-secondary border-border hover:border-primary'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-surface rounded-xl border border-border" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="text-5xl">📋</span>
          <p className="text-lg font-semibold text-text-primary">No transactions yet</p>
          <p className="text-sm text-text-secondary text-center">Tap the + button to log your first income or expense.</p>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border divide-y divide-divider px-4">
          {transactions.map((tx) => {
            const cat = tx.categoryId ? categoryMap[tx.categoryId] : null;
            return (
              <TransactionItem
                key={tx.id}
                type={tx.type}
                amount={tx.amount}
                currency={tx.currency}
                description={tx.description}
                categoryName={cat?.name ?? 'Uncategorised'}
                categoryIcon={cat?.icon ?? '💳'}
                date={new Date(tx.transactionDate)}
                onEdit={() => setModalMode({ mode: 'edit', tx })}
                onDelete={() => setDeletingTx(tx)}
              />
            );
          })}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setModalMode({ mode: 'create' })}
        className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-primary text-white text-3xl flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-20"
      >
        +
      </button>

      <AddTransactionModal
        key={modalMode?.mode === 'edit' ? modalMode.tx.id : 'new'}
        visible={modalMode !== null}
        categories={categories}
        budgets={budgets}
        initial={modalMode?.mode === 'edit' ? modalMode.tx : undefined}
        onClose={() => setModalMode(null)}
        onSubmit={async (payload) => {
          if (modalMode?.mode === 'edit') {
            await handleUpdate(modalMode.tx, payload);
          } else {
            await handleCreate(payload);
          }
        }}
      />

      <ConfirmModal
        open={!!deletingTx}
        title="Delete transaction?"
        message={`Remove "${deletingTx?.description || 'this transaction'}"? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTx(null)}
      />
    </div>
  );
}
