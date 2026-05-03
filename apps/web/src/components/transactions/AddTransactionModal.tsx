'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { POPULAR_CURRENCIES } from '@/constants/currencies';
import { useToastStore } from '@/store/toast.store';
import { getApiError } from '@/lib/api-error';
import type { Category, Budget, Transaction, TransactionCreate, TransactionType } from '@/types';

interface AddTransactionModalProps {
  visible: boolean;
  categories: Category[];
  budgets?: Budget[];
  onClose: () => void;
  onSubmit: (payload: TransactionCreate) => Promise<void>;
  initial?: Partial<Transaction>;
}

export function AddTransactionModal({ visible, categories, budgets = [], onClose, onSubmit, initial }: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'NGN');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [budgetId, setBudgetId] = useState(initial?.budgetId ?? '');
  const [date, setDate] = useState(
    initial?.transactionDate
      ? initial.transactionDate.split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const toast = useToastStore();

  const isEdit = !!initial;
  const filtered = categories.filter((c) => c.type === type || c.type === 'both');
  const filteredBudgets = budgets.filter((b) => b.type === type);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) {
      toast.error('Enter a valid amount');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        type,
        amount: Number(amount),
        currency,
        description,
        categoryId: categoryId || null,
        budgetId: budgetId || null,
        transactionDate: date,
      });
      toast.success(isEdit ? 'Transaction updated' : 'Transaction saved');
      onClose();
    } catch (err) {
      toast.error(getApiError(err, isEdit ? 'Failed to update transaction' : 'Failed to save transaction'));
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-2xl shadow-xl p-6 pb-8 sm:pb-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-primary">{isEdit ? 'Edit Transaction' : 'Add Transaction'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-2xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Type toggle */}
          <div className="flex bg-background rounded-xl p-1 border border-border">
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setType(t); setCategoryId(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${
                  type === t ? 'bg-primary text-white' : 'text-text-secondary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount + currency */}
          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {POPULAR_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
            <div className="flex-1">
              <Input label="" value={amount} onChange={setAmount} type="number" placeholder="0.00" />
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">No category</option>
              {filtered.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {filteredBudgets.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Budget <span className="text-text-muted font-normal">(optional)</span></label>
              <select
                value={budgetId}
                onChange={(e) => setBudgetId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">No budget</option>
                {filteredBudgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.category?.icon} {b.category?.name} — {b.currency} {b.amount.toLocaleString()} / {b.period}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input label="Date" value={date} onChange={setDate} type="date" />

          <Input label="Description" value={description} onChange={setDescription} placeholder="Optional" />

          <Button label={isEdit ? 'Save Changes' : 'Save Transaction'} type="submit" loading={loading} />
        </form>
      </div>
    </div>
  );
}
