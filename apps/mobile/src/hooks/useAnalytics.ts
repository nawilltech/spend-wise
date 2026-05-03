import { useState, useEffect, useCallback } from 'react';
import { reportsApi, type AnalyticsFilter } from '@services/api/reports';
import type { TransactionAnalytics } from '@/types';

export function useAnalytics(filter: AnalyticsFilter = { period: 'monthly' }) {
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterKey = filter.startDate && filter.endDate
    ? `${filter.startDate}|${filter.endDate}`
    : (filter.period ?? 'monthly');

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.getAnalytics(filter);
      setAnalytics(data);
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => { fetch(); }, [fetch]);

  return { analytics, loading, error, refetch: fetch };
}
