'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/services/api/admin';
import type { AdminAnalytics } from '@/types';

type Period = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

const PERIODS: Period[] = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5">
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-1">{value}</p>
      {sub && <p className="text-xs text-text-secondary mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAnalytics(await adminApi.getAnalytics(period));
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `${(n / 1_000).toFixed(1)}K`
      : n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <>
      {/* Period selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full capitalize transition-colors ${
              period === p
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {loading || !analytics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-surface border border-border rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Platform stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={analytics.userCount} />
            <StatCard label="Active Users" value={analytics.activeUsers} sub={`${analytics.userCount ? Math.round((analytics.activeUsers / analytics.userCount) * 100) : 0}% of total`} />
            <StatCard label="Transactions" value={analytics.entryCount} sub={`${analytics.incomeCount} in · ${analytics.expenseCount} out`} />
            <StatCard label="Total Volume" value={`${analytics.currency} ${fmt(analytics.totalVolume)}`} />
          </div>

          {/* Financial stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Income" value={`${analytics.currency} ${fmt(analytics.totalIncome)}`} />
            <StatCard label="Total Expense" value={`${analytics.currency} ${fmt(analytics.totalExpense)}`} />
            <StatCard label="Net Savings" value={`${analytics.currency} ${fmt(analytics.netSavings)}`} />
            <StatCard label="Savings Rate" value={`${analytics.savingsRate.toFixed(1)}%`} />
          </div>

          {/* Category breakdown */}
          {analytics.categoryBreakdown.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Spending by Category</h2>
              <div className="space-y-3">
                {analytics.categoryBreakdown.slice(0, 8).map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-28 truncate">
                      {cat.categoryName ?? 'Uncategorised'}
                    </span>
                    <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-text-primary w-12 text-right">
                      {cat.percentage.toFixed(1)}%
                    </span>
                    <span className="text-xs text-text-secondary w-16 text-right">
                      {analytics.currency} {fmt(cat.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
