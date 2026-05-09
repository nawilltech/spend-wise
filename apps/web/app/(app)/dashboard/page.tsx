'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuthStore } from '@/store/auth.store';
import { useTransactions } from '@/hooks/useTransactions';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCategories } from '@/hooks/useCategories';
import { useBudgets } from '@/hooks/useBudgets';
import { getCurrencySymbol } from '@/constants/currencies';
import { greeting } from '@/lib/utils';
import type { AnalyticsPeriod, TransactionCreate } from '@/types';
import type { AnalyticsFilter } from '@/services/api/reports';

type PeriodMode = AnalyticsPeriod | 'custom';

const PERIOD_LABELS: { key: PeriodMode; label: string }[] = [
  { key: 'daily',     label: 'Day' },
  { key: 'weekly',    label: 'Week' },
  { key: 'monthly',   label: 'Month' },
  { key: 'quarterly', label: 'Quarter' },
  { key: 'annual',    label: 'Year' },
  { key: 'custom',    label: 'Custom' },
];

function getPeriodRange(period: AnalyticsPeriod): { start: string; end: string } {
  const now = new Date();
  const s = new Date(now);
  switch (period) {
    case 'daily':     s.setHours(0, 0, 0, 0); break;
    case 'weekly':    s.setDate(now.getDate() - now.getDay()); s.setHours(0, 0, 0, 0); break;
    case 'monthly':   s.setDate(1); s.setHours(0, 0, 0, 0); break;
    case 'quarterly': s.setMonth(Math.floor(now.getMonth() / 3) * 3, 1); s.setHours(0, 0, 0, 0); break;
    case 'annual':    s.setMonth(0, 1); s.setHours(0, 0, 0, 0); break;
  }
  return { start: s.toISOString(), end: now.toISOString() };
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const symbol = getCurrencySymbol(user?.baseCurrency ?? 'NGN');
  const [modalVisible, setModalVisible] = useState(false);

  const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const analyticsFilter = useMemo((): AnalyticsFilter => {
    if (periodMode === 'custom' && customStart && customEnd) {
      return { startDate: new Date(customStart).toISOString(), endDate: new Date(customEnd + 'T23:59:59').toISOString() };
    }
    if (periodMode !== 'custom') return { period: periodMode };
    return { period: 'monthly' };
  }, [periodMode, customStart, customEnd]);

  const txDates = useMemo(() => {
    if (periodMode === 'custom' && customStart && customEnd) {
      return { fromDate: new Date(customStart).toISOString(), toDate: new Date(customEnd + 'T23:59:59').toISOString() };
    }
    if (periodMode !== 'custom') {
      const { start, end } = getPeriodRange(periodMode);
      return { fromDate: start, toDate: end };
    }
    return {};
  }, [periodMode, customStart, customEnd]);

  const { analytics, loading: analyticsLoading } = useAnalytics(analyticsFilter);
  const { transactions, loading: txLoading, create } = useTransactions({ limit: 10, ...txDates });
  const { categories } = useCategories();
  const { budgets } = useBudgets();

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const budgetMap = Object.fromEntries(budgets.map((b) => [b.id, b]));

  const budgetSpent = useMemo(() => {
    const map: Record<string, number> = {};
    if (analytics?.budgetBreakdown) {
      for (const b of analytics.budgetBreakdown) map[b.budgetId] = b.amount;
    }
    return map;
  }, [analytics]);

  async function handleCreate(payload: TransactionCreate) {
    await create(payload);
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">{greeting()}</p>
          <h1 className="text-2xl font-bold text-text-primary">{user?.name ?? 'User'}</h1>
        </div>
        <button
          onClick={() => setModalVisible(true)}
          className="w-10 h-10 rounded-full bg-primary text-white text-2xl flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
        >
          +
        </button>
      </div>

      {/* Period filter */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {PERIOD_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriodMode(key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                periodMode === key
                  ? 'bg-primary text-white border-primary'
                  : 'text-text-secondary border-divider hover:border-primary/40'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {periodMode === 'custom' && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-divider text-sm text-text-primary focus:outline-none focus:border-primary"
            />
            <span className="text-text-muted text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-divider text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        )}
      </div>

      {/* Balance card */}
      <div className="rounded-2xl p-6 text-white" style={{ background: '#0F4C75' }}>
        {analyticsLoading ? (
          <div className="animate-pulse h-20 bg-white/10 rounded-xl" />
        ) : (
          <>
            <p className="text-sm text-white/70 mb-2">
              {periodMode === 'custom' && customStart && customEnd
                ? `${customStart} → ${customEnd}`
                : `${PERIOD_LABELS.find((p) => p.key === periodMode)?.label ?? 'Period'} balance`}
            </p>
            <p className="text-4xl font-bold mb-5">
              {symbol}{(analytics?.netSavings ?? 0).toLocaleString()}
            </p>
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-white/70">Income</p>
                <p className="text-base font-semibold text-green-300 mt-0.5">
                  {symbol}{(analytics?.totalIncome ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-xs text-white/70">Expenses</p>
                <p className="text-base font-semibold text-red-300 mt-0.5">
                  {symbol}{(analytics?.totalExpense ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-xs text-white/70">Savings rate</p>
                <p className="text-base font-semibold text-white/90 mt-0.5">
                  {(analytics?.savingsRate ?? 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Budget utilization */}
      {budgets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Budget Utilization</h2>
          <Card>
            <div className="space-y-4">
              {budgets.map((b) => {
                const spent = budgetSpent[b.id] ?? 0;
                const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
                const over = spent > b.amount;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{b.category?.icon ?? '💰'}</span>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{b.category?.name}</p>
                          <p className="text-xs text-text-muted capitalize">{b.type} · {b.period}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${over ? 'text-danger' : 'text-text-primary'}`}>
                          {symbol}{spent.toLocaleString()} / {symbol}{b.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-text-muted">{pct.toFixed(0)}% used</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-danger' : 'bg-primary'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Recent transactions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Recent Transactions</h2>
        <Card className="p-0 overflow-hidden">
          {txLoading ? (
            <div className="animate-pulse space-y-3 p-4">
              {[1,2,3].map((i) => <div key={i} className="h-10 bg-divider rounded-lg" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-10 text-center text-text-muted text-sm">
              No transactions in this period.
            </div>
          ) : (
            <div className="px-4 divide-y divide-divider">
              {transactions.map((tx) => {
                const cat = tx.categoryId ? categoryMap[tx.categoryId] : null;
                const budget = tx.budgetId ? budgetMap[tx.budgetId] : null;
                return (
                  <TransactionItem
                    key={tx.id}
                    type={tx.type}
                    amount={tx.amount}
                    currency={tx.currency}
                    description={tx.description || (budget ? `${budget.category?.name}` : 'Transaction')}
                    categoryName={cat?.name ?? 'Uncategorised'}
                    categoryIcon={cat?.icon ?? '💳'}
                    date={new Date(tx.transactionDate)}
                  />
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Top spending categories */}
      {analytics && analytics.categoryBreakdown.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text-primary">Top Spending Categories</h2>
          <Card>
            <div className="space-y-1">
              {analytics.categoryBreakdown.slice(0, 4).map((item) => (
                <div key={item.categoryId ?? item.categoryName} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{item.categoryName ?? 'Other'}</p>
                    <p className="text-xs text-text-muted">{item.count} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">{symbol}{item.amount.toLocaleString()}</p>
                    <p className="text-xs text-text-secondary">{item.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <AddTransactionModal
        visible={modalVisible}
        categories={categories}
        budgets={budgets}
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
