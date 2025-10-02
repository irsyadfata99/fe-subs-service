import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const BASE_URL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL
  : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper: Delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: Check if error is retryable
const isRetryableError = (error: AxiosError): boolean => {
  if (!error.response) return true; // Network errors are retryable
  const status = error.response.status;
  return status === 408 || status === 429 || status >= 500; // Timeout, Rate limit, Server errors
};

// Global event emitter for 403 suspended account
export const suspendedAccountEvent = new EventTarget();

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retry?: number };

    // Log error for debugging
    console.error("API Error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      Cookies.remove("token");
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register")
      ) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // NEW: Handle 403 Suspended Account
    if (error.response?.status === 403) {
      const responseData = error.response.data as any;

      // Check if it's a suspended account error
      if (responseData?.error === "Account suspended") {
        console.log("Account suspended detected, triggering modal...");

        // Emit event to trigger modal
        const event = new CustomEvent("account-suspended", {
          detail: responseData.data,
        });
        suspendedAccountEvent.dispatchEvent(event);

        // Don't redirect, let modal handle it
        return Promise.reject(error);
      }
    }

    // Retry logic for retryable errors
    if (isRetryableError(error) && config) {
      config._retry = config._retry || 0;

      if (config._retry < MAX_RETRIES) {
        config._retry += 1;
        console.log(`Retrying request... (${config._retry}/${MAX_RETRIES})`);

        await delay(RETRY_DELAY * config._retry);
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

// Helper: Get user-friendly error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Terjadi kesalahan jaringan. Periksa koneksi Anda.";
    }

    const data = error.response.data as { error?: string; message?: string };
    return (
      data?.error || data?.message || "Terjadi kesalahan. Silakan coba lagi."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan yang tidak terduga.";
};

export default api;
