'use client';

import { useState, useEffect, useCallback } from 'react';
import { budgetsApi } from '@/services/api/budgets';
import { reportsApi } from '@/services/api/reports';
import type { Budget, BudgetCreate, BudgetWithSpent } from '@/types';

export function useBudgets() {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawBudgets, analytics] = await Promise.all([
        budgetsApi.list(),
        reportsApi.getAnalytics('monthly').catch(() => null),
      ]);

      const spentByCategoryId: Record<string, number> = {};
      if (analytics) {
        for (const item of analytics.categoryBreakdown) {
          if (item.categoryId) spentByCategoryId[item.categoryId] = item.amount;
        }
      }

      const withSpent: BudgetWithSpent[] = rawBudgets.map((b: Budget) => {
        const spent = spentByCategoryId[b.categoryId] ?? 0;
        return {
          ...b,
          spent,
          remaining: Math.max(b.amount - spent, 0),
          percentUsed: b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0,
        };
      });

      setBudgets(withSpent);
    } catch {
      setError('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (payload: BudgetCreate): Promise<Budget | null> => {
    try {
      const budget = await budgetsApi.create(payload);
      await fetch();
      return budget;
    } catch {
      return null;
    }
  }, [fetch]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await budgetsApi.delete(id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { budgets, loading, error, refetch: fetch, create, remove };
}
