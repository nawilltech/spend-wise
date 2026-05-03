import { apiClient } from './client';
import type { User } from '@/types';

interface LoginPayload { email: string; password: string }
interface RegisterPayload { email: string; password: string; name: string; baseCurrency: string; location: string }
interface ForgotPasswordPayload { email: string }
interface ForgotPasswordResponse { session: string; message: string }
interface ResetPasswordPayload { session: string; otp: string; newPassword: string; confirmNewPassword: string }

export const authApi = {
  async login(payload: LoginPayload): Promise<{ user: User }> {
    const { data } = await apiClient.post('/auth/login', payload);
    localStorage.setItem('access_token', data.tokens.accessToken);
    localStorage.setItem('refresh_token', data.tokens.refreshToken);
    return data;
  },

  async register(payload: RegisterPayload): Promise<{ user: User }> {
    const { data } = await apiClient.post('/auth/register', payload);
    localStorage.setItem('access_token', data.tokens.accessToken);
    localStorage.setItem('refresh_token', data.tokens.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try { await apiClient.post('/auth/logout'); } catch { /* best effort */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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
};
