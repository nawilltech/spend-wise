import { apiClient } from './client';
import type { TransactionAnalytics, AnalyticsPeriod } from '@/types';

export interface AnalyticsFilter {
  period?: AnalyticsPeriod;
  startDate?: string;
  endDate?: string;
}

export const reportsApi = {
  async getAnalytics(filter: AnalyticsFilter = { period: 'monthly' }): Promise<TransactionAnalytics> {
    const params: Record<string, string> = {};
    if (filter.startDate && filter.endDate) {
      params.start_date = filter.startDate;
      params.end_date = filter.endDate;
    } else {
      params.period = filter.period ?? 'monthly';
    }
    const { data } = await apiClient.get('/reports/analytics', { params });
    return data;
  },
};
