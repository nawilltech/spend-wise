import { apiClient } from './client';
import type { Goal, GoalCreate } from '@/types';

export const goalsApi = {
  async list(): Promise<Goal[]> {
    const { data } = await apiClient.get('/goals');
    return data;
  },

  async create(payload: GoalCreate): Promise<Goal> {
    const { data } = await apiClient.post('/goals', payload);
    return data;
  },

  async updateProgress(id: string, amount: number): Promise<Goal> {
    const { data } = await apiClient.patch(`/goals/${id}/progress`, { amount });
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/goals/${id}`);
  },
};
