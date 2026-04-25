import * as SecureStore from 'expo-secure-store';
import { apiClient } from './client';
import type { User, AuthTokens } from '@types/index';

interface LoginPayload { email: string; password: string }
interface RegisterPayload { email: string; password: string; name: string; baseCurrency: string; location: string }

export const authApi = {
  async login(payload: LoginPayload): Promise<{ user: User; tokens: AuthTokens }> {
    const { data } = await apiClient.post('/auth/login', payload);
    await SecureStore.setItemAsync('access_token', data.tokens.access_token);
    await SecureStore.setItemAsync('refresh_token', data.tokens.refresh_token);
    return data;
  },

  async register(payload: RegisterPayload): Promise<{ user: User; tokens: AuthTokens }> {
    const { data } = await apiClient.post('/auth/register', payload);
    await SecureStore.setItemAsync('access_token', data.tokens.access_token);
    await SecureStore.setItemAsync('refresh_token', data.tokens.refresh_token);
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
