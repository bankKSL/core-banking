import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import i18n from "@/i18n";
import { useAuthStore } from "@/store";
import { useNetworkStore } from "@/store/network";

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
      return Promise.reject(error);
    }
    // Distinguish connection / timeout errors from HTTP error responses
    // (400/403/404/409/500 are handled by the mutation/query error paths).
    const code = error.code;
    const isNetworkError = code === "ERR_NETWORK";
    const isTimeout = code === "ECONNABORTED" || (error.message ?? "").toLowerCase().includes("timeout");
    if (!error.response && (isNetworkError || isTimeout)) {
      useNetworkStore.getState().reportNetworkError(
        isTimeout ? "timeout" : "connection",
        isTimeout
          ? i18n.t("The request timed out. Please check your connection and try again.")
          : i18n.t("Unable to connect to the server. Please check your connection and try again."),
      );
    }
    return Promise.reject(error);
  },
);

export default client;
