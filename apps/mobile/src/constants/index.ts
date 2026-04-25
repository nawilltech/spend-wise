export * from './colors';
export * from './categories';
export * from './currencies';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const SYNC_INTERVAL_MS = 30_000;       // sync every 30s when online
export const RATE_CACHE_TTL_MS = 86_400_000;  // 24h in ms

export const BUDGET_ALERT_THRESHOLD = 0.8;    // alert at 80% of budget
