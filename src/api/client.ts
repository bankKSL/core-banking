import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

// ─── Base Axios Instance ──────────────────────────────────────
const client = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api/v1",
    timeout: 30_000,
    headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor ──────────────────────────────────────
client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Attach auth token from Zustand store when we have one
        // Example: const token = useAuthStore.getState().token;
        // if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────
client.interceptors.response.use(
    (res) => res,
    (error: AxiosError<{ message?: string }>) => {
        // Global error handling (401 → force logout, 500 → toast, etc.)
        if (error.response?.status === 401) {
            // Example: useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    },
);

export default client;
