import { apiClient } from './client';
import type { TransactionAnalytics, AnalyticsPeriod } from '@/types';

export const reportsApi = {
  async getAnalytics(period: AnalyticsPeriod = 'monthly'): Promise<TransactionAnalytics> {
    const { data } = await apiClient.get('/reports/analytics', { params: { period } });
    return data;
  },
};
