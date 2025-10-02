import axios, { AxiosError, AxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const BASE_URL = API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error: AxiosError): boolean => {
  if (!error.response) return true;
  const status = error.response.status;
  return status === 408 || status === 429 || status >= 500;
};

export const suspendedAccountEvent = new EventTarget();

api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retry?: number };

    // ✅ IMPROVED: Log each property separately to avoid serialization issues
    console.group("❌ API Error");
    console.log("URL:", error.config?.url || "unknown");
    console.log("Method:", error.config?.method?.toUpperCase() || "unknown");
    console.log("Status:", error.response?.status || "no response");
    console.log("Status Text:", error.response?.statusText || "");
    console.log("Error Message:", error.message);
    console.log("Is Network Error:", !error.response);
    if (error.response?.data) {
      console.log("Response Data:", error.response.data);
    }
    console.groupEnd();

    // Network error (backend not running)
    if (!error.response) {
      console.error("🔴 Backend tidak dapat dijangkau. Pastikan backend berjalan di http://localhost:5000");
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response.status === 401) {
      console.warn("🔐 Token invalid/expired - Redirecting to login");
      Cookies.remove("token");
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Handle 403 Suspended/Overdue Account
    if (error.response.status === 403) {
      const responseData = error.response.data as {
        error?: string;
        data?: {
          status?: string;
          reason?: string;
          invoice?: {
            id: number;
            invoice_number: string;
            total_amount: number;
            due_date: string;
            payment_method_selected?: "BCA_VA" | "QRIS" | null;
            tripay_va_number?: string;
            tripay_qr_url?: string;
            tripay_payment_url?: string;
            tripay_expired_time?: string;
            tripay_reference?: string;
          };
        };
      };

      console.log("🔍 403 Response Data:", responseData);

      // Check if account is suspended OR overdue
      if (responseData?.error === "Account suspended" || responseData?.data?.status === "overdue") {
        console.log("🔴 Account suspended/overdue detected!");
        console.log("   Reason:", responseData.data?.reason);
        console.log("   Invoice ID:", responseData.data?.invoice?.id);

        const suspendedData = {
          ...responseData.data,
          status: "suspended" as const,
          invoice: responseData.data?.invoice
            ? {
                id: responseData.data.invoice.id,
                invoice_number: responseData.data.invoice.invoice_number,
                total_amount: responseData.data.invoice.total_amount,
                due_date: responseData.data.invoice.due_date,
                payment_method_selected: responseData.data.invoice.payment_method_selected,
                tripay_va_number: responseData.data.invoice.tripay_va_number,
                tripay_qr_url: responseData.data.invoice.tripay_qr_url,
                tripay_payment_url: responseData.data.invoice.tripay_payment_url,
                tripay_expired_time: responseData.data.invoice.tripay_expired_time,
                tripay_reference: responseData.data.invoice.tripay_reference,
              }
            : undefined,
        };

        console.log("📤 Dispatching account-suspended event...");
        const event = new CustomEvent("account-suspended", {
          detail: suspendedData,
        });
        suspendedAccountEvent.dispatchEvent(event);

        return Promise.reject(error);
      }
    }

    // Retry logic for retryable errors
    if (isRetryableError(error) && config) {
      config._retry = config._retry || 0;

      if (config._retry < MAX_RETRIES) {
        config._retry += 1;
        console.log(`⚠️ Retry ${config._retry}/${MAX_RETRIES}: ${config.url}`);

        await delay(RETRY_DELAY * config._retry);
        return api(config);
      } else {
        console.error(`❌ Max retries reached: ${config.url}`);
      }
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Terjadi kesalahan jaringan. Periksa koneksi Anda dan pastikan backend berjalan.";
    }

    const data = error.response.data as { error?: string; message?: string };
    return data?.error || data?.message || "Terjadi kesalahan. Silakan coba lagi.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan yang tidak terduka.";
};

export default api;
