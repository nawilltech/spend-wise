import { apiClient } from './client';
import type { AdminUser, AdminUserUpdate, AdminTransaction, AdminAnalytics } from '@/types';

export const adminApi = {
  async listUsers(limit = 50, offset = 0): Promise<AdminUser[]> {
    const { data } = await apiClient.get('/admin/users', { params: { limit, offset } });
    return data;
  },

  async updateUser(userId: string, payload: AdminUserUpdate): Promise<AdminUser> {
    const { data } = await apiClient.patch(`/admin/users/${userId}`, payload);
    return data;
  },

  async verifyUserEmail(userId: string): Promise<AdminUser> {
    const { data } = await apiClient.patch(`/admin/users/${userId}/verify-email`, {});
    return data;
  },

  async listTransactions(limit = 50, offset = 0): Promise<AdminTransaction[]> {
    const { data } = await apiClient.get('/admin/transactions', { params: { limit, offset } });
    return data;
  },

  async getAnalytics(period = 'monthly'): Promise<AdminAnalytics> {
    const { data } = await apiClient.get('/admin/analytics', { params: { period } });
    return data;
  },
};
