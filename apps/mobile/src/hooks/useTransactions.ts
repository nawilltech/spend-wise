import { useState, useEffect, useCallback } from 'react';
import { transactionsApi } from '@services/api/transactions';
import type { Transaction, TransactionCreate, TransactionType } from '@/types';

interface UseTransactionsOptions {
  limit?: number;
  type?: TransactionType;
  autoFetch?: boolean;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { limit = 50, type, autoFetch = true } = options;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (filterType?: TransactionType) => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionsApi.list({ limit, type: filterType ?? type });
      setTransactions(data);
    } catch {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [limit, type]);

  const create = useCallback(async (payload: TransactionCreate): Promise<Transaction | null> => {
    try {
      const tx = await transactionsApi.create(payload);
      setTransactions((prev) => [tx, ...prev]);
      return tx;
    } catch {
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      await transactionsApi.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [autoFetch, fetch]);

  return { transactions, loading, error, refetch: fetch, create, remove };
}
