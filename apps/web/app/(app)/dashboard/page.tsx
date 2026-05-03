'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal';
import { useAuthStore } from '@/store/auth.store';
import { useTransactions } from '@/hooks/useTransactions';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCategories } from '@/hooks/useCategories';
import { getCurrencySymbol } from '@/constants/currencies';
import { greeting } from '@/lib/utils';
import type { TransactionCreate } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const symbol = getCurrencySymbol(user?.baseCurrency ?? 'NGN');
  const [modalVisible, setModalVisible] = useState(false);

  const { analytics, loading: analyticsLoading } = useAnalytics('monthly');
  const { transactions, loading: txLoading, create } = useTransactions({ limit: 5 });
  const { categories } = useCategories();

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const recent = transactions.slice(0, 5);

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

      {/* Balance card */}
      <div className="rounded-2xl p-6 text-white" style={{ background: '#0F4C75' }}>
        {analyticsLoading ? (
          <div className="animate-pulse h-20 bg-white/10 rounded-xl" />
        ) : (
          <>
            <p className="text-sm text-white/70 mb-2">Net Balance this month</p>
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

      {/* Recent transactions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-text-primary">Recent Transactions</h2>
        <Card className="p-0 overflow-hidden">
          {txLoading ? (
            <div className="animate-pulse space-y-3 p-4">
              {[1,2,3].map((i) => <div key={i} className="h-10 bg-divider rounded-lg" />)}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-10 text-center text-text-muted text-sm">
              No transactions yet.{'\n'}Tap + to add your first one.
            </div>
          ) : (
            <div className="px-4 divide-y divide-divider">
              {recent.map((tx) => {
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
        onClose={() => setModalVisible(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
