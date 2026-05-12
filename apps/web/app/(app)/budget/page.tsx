'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useBudgets } from '@/hooks/useBudgets';
import { useAuthStore } from '@/store/auth.store';
import { getCurrencySymbol } from '@/constants/currencies';
import { Colors } from '@/constants/colors';

export default function BudgetPage() {
  const { user } = useAuthStore();
  const symbol = getCurrencySymbol(user?.baseCurrency ?? 'NGN');
  const { budgets, loading, error } = useBudgets();

  const active = budgets.filter((b) => b.isActive);

  return (
    <div className="p-5 md:p-8 space-y-5 max-w-3xl">
      <h1 className="text-2xl font-bold text-text-primary">Budgets</h1>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-28 bg-surface rounded-2xl border border-border" />)}
        </div>
      ) : error ? (
        <Card><p className="text-danger text-center py-4">{error}</p></Card>
      ) : active.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 py-12">
          <span className="text-5xl">🎯</span>
          <p className="text-lg font-semibold text-text-primary">No budgets yet</p>
          <p className="text-sm text-text-secondary text-center max-w-xs">
            Set spending limits per category to stay on track.
          </p>
          <Link
            href="/settings"
            className="mt-2 px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            Go to Settings
          </Link>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="flex flex-col items-center py-4">
              <p className="text-2xl font-bold text-text-primary">{active.length}</p>
              <p className="text-xs text-text-secondary mt-0.5">Active</p>
            </Card>
            <Card className="flex flex-col items-center py-4">
              <p className="text-2xl font-bold text-danger">{active.filter((b) => b.percentUsed >= 90).length}</p>
              <p className="text-xs text-text-secondary mt-0.5">Near limit</p>
            </Card>
            <Card className="flex flex-col items-center py-4">
              <p className="text-2xl font-bold text-success">{active.filter((b) => b.percentUsed < 70).length}</p>
              <p className="text-xs text-text-secondary mt-0.5">On track</p>
            </Card>
          </div>

          {/* Budget cards */}
          {active.map((budget) => (
            <Card key={budget.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-background flex items-center justify-center text-xl flex-shrink-0">
                  {budget.category.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{budget.category.name}</p>
                  <p className="text-xs text-text-secondary capitalize">{budget.period} · {budget.category.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-text-primary">{symbol}{budget.amount.toLocaleString()}</p>
                  <p className="text-xs text-text-muted">limit</p>
                </div>
              </div>

              <ProgressBar percent={budget.percentUsed} />

              <div className="flex justify-between">
                <p className="text-sm text-text-secondary">
                  Spent: <span className="font-semibold text-text-primary">{symbol}{budget.spent.toLocaleString()}</span>
                </p>
                <p className={`text-sm font-medium ${budget.remaining === 0 ? 'text-danger' : 'text-success'}`}>
                  {budget.remaining === 0 ? 'Over budget' : `${symbol}${budget.remaining.toLocaleString()} left`}
                </p>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
