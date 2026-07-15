import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store";

// ─── Base Axios Instance ──────────────────────────────────────
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "https://localhost:8443/fineract-provider/api/v1",
    timeout: 30_000,
    headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor ──────────────────────────────────────
client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Attach auth token from Zustand store
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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
