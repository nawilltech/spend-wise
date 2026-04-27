import * as SecureStore from 'expo-secure-store';
import { apiClient } from './client';
import type { User } from '@/types';

interface LoginPayload { email: string; password: string }
interface RegisterPayload { email: string; password: string; name: string; baseCurrency: string; location: string }

export const authApi = {
  async login(payload: LoginPayload): Promise<{ user: User }> {
    const { data } = await apiClient.post('/auth/login', payload);
    // tokens are camelized by transform: accessToken, refreshToken
    await SecureStore.setItemAsync('access_token', data.tokens.accessToken);
    await SecureStore.setItemAsync('refresh_token', data.tokens.refreshToken);
    return data;
  },

  async register(payload: RegisterPayload): Promise<{ user: User }> {
    const { data } = await apiClient.post('/auth/register', payload);
    await SecureStore.setItemAsync('access_token', data.tokens.accessToken);
    await SecureStore.setItemAsync('refresh_token', data.tokens.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try { await apiClient.post('/auth/logout'); } catch { /* best effort */ }
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};
