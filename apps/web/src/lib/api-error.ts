import { isAxiosError } from 'axios';

export function getApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object' && 'message' in detail) return String(detail.message);
    if (Array.isArray(detail)) return detail.map((d) => d.msg ?? String(d)).join(', ');
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export interface LoginErrorDetail {
  message: string;
  attempts: number;
  maxAttempts: number;
}

export function getLoginErrorDetail(err: unknown): LoginErrorDetail | null {
  if (!isAxiosError(err)) return null;
  const detail = err.response?.data?.detail;
  if (detail && typeof detail === 'object' && 'attempts' in detail) {
    return detail as LoginErrorDetail;
  }
  return null;
}
