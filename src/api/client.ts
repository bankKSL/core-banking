import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store";

// ─── Base Axios Instance ──────────────────────────────────────
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Fineract-Platform-TenantId": "default",
    "Content-Type": "application/json",
  },
  timeout: 30_000,
});

// ─── Request Interceptor ──────────────────────────────────────
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach Basic Auth credentials from Zustand store.
    // The login endpoint is called before the user is authenticated,
    // so no Authorization header is sent until login succeeds.
    const basicAuth = useAuthStore.getState().basicAuth;
    if (basicAuth) {
      config.headers.Authorization = `Basic ${basicAuth}`;
    } else {
      delete config.headers.Authorization;
    }
    // Fineract requires this header for tenant identification
    config.headers["Fineract-Platform-TenantId"] = "default";
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────
client.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    // 401 → force logout
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default client;
