'use client';

import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '@/services/api/reports';
import type { TransactionAnalytics, AnalyticsPeriod } from '@/types';

export function useAnalytics(period: AnalyticsPeriod = 'monthly') {
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (p: AnalyticsPeriod = period) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.getAnalytics(p);
      setAnalytics(data);
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetch(); }, [fetch]);

  return { analytics, loading, error, refetch: fetch };
}
