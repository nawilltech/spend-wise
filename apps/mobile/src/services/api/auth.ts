import * as SecureStore from 'expo-secure-store';
import { apiClient } from './client';
import type { User } from '@/types';

interface UpdateProfilePayload { name?: string; baseCurrency?: string; location?: string; riskTolerance?: string }

interface LoginPayload { email: string; password: string }
interface RegisterPayload { email: string; password: string; confirmPassword: string; name: string; baseCurrency: string; location: string }
interface ForgotPasswordPayload { email: string }
interface ForgotPasswordResponse { session: string; message: string }
interface ResetPasswordPayload { session: string; otp: string; newPassword: string; confirmNewPassword: string }

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

  async resendVerification(): Promise<void> {
    await apiClient.post('/auth/resend-verification');
  },

  async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    const { data } = await apiClient.post('/auth/forgot-password', payload);
    return data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await apiClient.post('/auth/reset-password', payload);
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await apiClient.patch('/auth/me', payload);
    return data;
  },
};
