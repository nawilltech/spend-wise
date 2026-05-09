import { apiClient } from './client';
import type { Transaction, TransactionCreate, TransactionUpdate, BulkTransactionResponse } from '@/types';

interface ListParams {
  limit?: number;
  offset?: number;
  type?: 'income' | 'expense';
  categoryId?: string;
  fromDate?: string;
  toDate?: string;
}

export const transactionsApi = {
  async list(params?: ListParams): Promise<Transaction[]> {
    const { data } = await apiClient.get('/transactions', { params });
    return data;
  },

  async get(id: string): Promise<Transaction> {
    const { data } = await apiClient.get(`/transactions/${id}`);
    return data;
  },

  async create(payload: TransactionCreate): Promise<Transaction> {
    const { data } = await apiClient.post('/transactions', payload);
    return data;
  },

  async bulkCreate(payload: TransactionCreate[]): Promise<BulkTransactionResponse> {
    const { data } = await apiClient.post('/transactions/bulk', payload);
    return data;
  },

  async update(id: string, payload: TransactionUpdate): Promise<Transaction> {
    const { data } = await apiClient.patch(`/transactions/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/transactions/${id}`);
  },
};
