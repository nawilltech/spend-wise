'use client';

import { useState, useEffect, useCallback } from 'react';
import { transactionsApi } from '@/services/api/transactions';
import { getApiError } from '@/lib/api-error';
import type { Transaction, TransactionCreate, TransactionUpdate, TransactionType } from '@/types';

interface UseTransactionsOptions {
  limit?: number;
  type?: TransactionType;
  fromDate?: string;
  toDate?: string;
  autoFetch?: boolean;
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { limit = 50, type, fromDate, toDate, autoFetch = true } = options;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (filterType?: TransactionType) => {
    setLoading(true);
    setError(null);
    try {
      const data = await transactionsApi.list({ limit, type: filterType ?? type, fromDate, toDate });
      setTransactions(data);
    } catch {
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [limit, type, fromDate, toDate]);

  const create = useCallback(async (payload: TransactionCreate): Promise<Transaction> => {
    try {
      const tx = await transactionsApi.create(payload);
      setTransactions((prev) => [tx, ...prev]);
      return tx;
    } catch (err) {
      throw new Error(getApiError(err, 'Failed to save transaction'));
    }
  }, []);

  const update = useCallback(async (id: string, payload: TransactionUpdate): Promise<Transaction> => {
    try {
      const tx = await transactionsApi.update(id, payload);
      setTransactions((prev) => prev.map((t) => (t.id === id ? tx : t)));
      return tx;
    } catch (err) {
      throw new Error(getApiError(err, 'Failed to update transaction'));
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

  return { transactions, loading, error, refetch: fetch, create, update, remove };
}
