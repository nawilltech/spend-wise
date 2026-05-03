import { apiClient } from './client';
import type { Category, CategoryCreate } from '@/types';

interface CategoryUpdate { name?: string; icon?: string; color?: string; type?: string }

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const { data } = await apiClient.get('/categories');
    return data;
  },

  async create(payload: CategoryCreate): Promise<Category> {
    const { data } = await apiClient.post('/categories', payload);
    return data;
  },

  async update(id: string, payload: CategoryUpdate): Promise<Category> {
    const { data } = await apiClient.patch(`/categories/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
