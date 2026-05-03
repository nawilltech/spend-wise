import { apiClient } from './client';
import type { Budget, BudgetCreate } from '@/types';

interface BudgetUpdate {
  amount?: number;
  currency?: string;
  period?: string;
  type?: string;
  description?: string;
  isActive?: boolean;
}

export const budgetsApi = {
  async list(type?: string): Promise<Budget[]> {
    const params = type ? { type } : undefined;
    const { data } = await apiClient.get('/budgets', { params });
    return data;
  },

  async create(payload: BudgetCreate): Promise<Budget> {
    const { data } = await apiClient.post('/budgets', payload);
    return data;
  },

  async update(id: string, payload: BudgetUpdate): Promise<Budget> {
    const { data } = await apiClient.patch(`/budgets/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/budgets/${id}`);
  },
};
