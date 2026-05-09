import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@constants/index';
import { camelizeKeys, snakelizeKeys } from '@utils/case';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  // Outgoing: camelCase → snake_case before JSON.stringify
  transformRequest: [
    (data: unknown) => (data && typeof data === 'object' ? snakelizeKeys(data) : data),
    ...(Array.isArray(axios.defaults.transformRequest)
      ? axios.defaults.transformRequest
      : axios.defaults.transformRequest
      ? [axios.defaults.transformRequest]
      : []),
  ],
  // Incoming: JSON.parse → snake_case → camelCase
  transformResponse: [
    ...(Array.isArray(axios.defaults.transformResponse)
      ? axios.defaults.transformResponse
      : axios.defaults.transformResponse
      ? [axios.defaults.transformResponse]
      : []),
    (data: unknown) => (data && typeof data === 'object' ? camelizeKeys(data) : data),
  ],
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        // Use raw axios (no transforms) so we can read snake_case fields directly
        const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        await SecureStore.setItemAsync('access_token', data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(original);
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }

    return Promise.reject(error);
  }
);
