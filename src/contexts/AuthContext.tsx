"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api, { suspendedAccountEvent } from "@/lib/api";
import { Client } from "@/types";
import { isAccountRestricted } from "@/lib/utils";

interface SuspendedAccountData {
  status: "suspended";
  reason: "trial_expired" | "payment_overdue" | "account_suspended";
  details?: Record<string, unknown>;
  invoice?: {
    id: number;
    invoice_number: string;
    total_amount: number;
    due_date: string;
    payment_url?: string;
    payment_method_selected?: "BCA_VA" | "QRIS" | null;
    tripay_va_number?: string;
    tripay_qr_url?: string;
    tripay_payment_url?: string;
    tripay_expired_time?: string;
    tripay_reference?: string;
  };
}

interface AuthContextType {
  user: Client | null;
  loading: boolean;
  suspendedData: SuspendedAccountData | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearSuspendedData: () => void;
  refreshSuspendedData: () => Promise<void>;
}

interface RegisterData {
  business_name: string;
  business_type: string;
  email: string;
  password: string;
  phone?: string;
  contact_whatsapp?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspendedData, setSuspendedData] =
    useState<SuspendedAccountData | null>(null);
  const router = useRouter();

  const fetchSuspendedInvoice = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await api.get("/billing/invoices", {
          params: { status: "pending", limit: 1 },
          signal,
        });

        const invoices =
          response.data.data?.invoices || response.data.data || [];

        if (invoices.length > 0 && !signal?.aborted) {
          const invoice = invoices[0];

          console.log("📋 Invoice diambil:", invoice);

          // Determine reason based on user status
          let reason:
            | "trial_expired"
            | "payment_overdue"
            | "account_suspended" = "payment_overdue";
          if (user?.status === "trial") {
            reason = "trial_expired";
          } else if (user?.status === "overdue") {
            reason = "payment_overdue";
          } else if (user?.status === "suspended") {
            reason = user.suspension_reason || "account_suspended";
          }

          setSuspendedData({
            status: "suspended",
            reason: reason,
            invoice: {
              id: invoice.id,
              invoice_number: invoice.invoice_number,
              total_amount: invoice.total_amount,
              due_date: invoice.due_date,
              payment_method_selected: invoice.payment_method_selected,
              tripay_va_number: invoice.tripay_va_number,
              tripay_qr_url: invoice.tripay_qr_url,
              tripay_payment_url: invoice.tripay_payment_url,
              tripay_expired_time: invoice.tripay_expired_time,
              tripay_reference: invoice.tripay_reference,
            },
          });

          console.log("✅ Data suspended dengan amount:", invoice.total_amount);
        }
      } catch (error: unknown) {
        const err = error as { name?: string };
        if (err.name !== "AbortError") {
          console.error("Gagal mengambil invoice suspended:", error);
        }
      }
    },
    [user?.status, user?.suspension_reason]
  );

  const checkAuth = useCallback(async () => {
    const token = Cookies.get("token");
    if (!token) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    try {
      const response = await api.get("/auth/me", {
        signal: abortController.signal,
      });
      const userData = response.data.data;
      setUser(userData);

      // Fetch invoice for suspended OR overdue users using utility
      if (
        isAccountRestricted(userData.status) &&
        !abortController.signal.aborted
      ) {
        await fetchSuspendedInvoice(abortController.signal);
      }
    } catch (error: unknown) {
      const err = error as { response?: { status?: number }; name?: string };
      if (err.name !== "AbortError") {
        if (err.response?.status !== 403) {
          Cookies.remove("token");
        }
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }

    return () => abortController.abort();
  }, [fetchSuspendedInvoice]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initAuth = async () => {
      const result = await checkAuth();
      if (result) {
        cleanup = result;
      }
    };

    initAuth();

    const handleSuspended = (event: Event) => {
      const customEvent = event as CustomEvent<SuspendedAccountData>;
      console.log("Event account suspended diterima:", customEvent.detail);
      setSuspendedData(customEvent.detail);
    };

    suspendedAccountEvent.addEventListener(
      "account-suspended",
      handleSuspended
    );

    return () => {
      if (cleanup) {
        cleanup();
      }
      suspendedAccountEvent.removeEventListener(
        "account-suspended",
        handleSuspended
      );
    };
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, client } = response.data.data;

    Cookies.set("token", token, { expires: 7 });
    setUser(client);

    // Handle suspended OR overdue status using utility
    if (isAccountRestricted(client.status)) {
      const reason =
        client.suspension_reason ||
        (client.status === "overdue" ? "payment_overdue" : "trial_expired");

      try {
        const invoiceRes = await api.get("/billing/invoices", {
          params: { status: "pending", limit: 1 },
        });

        const invoices =
          invoiceRes.data.data?.invoices || invoiceRes.data.data || [];

        if (invoices.length > 0) {
          const invoice = invoices[0];
          setSuspendedData({
            status: "suspended",
            reason: reason,
            invoice: {
              id: invoice.id,
              invoice_number: invoice.invoice_number,
              total_amount: invoice.total_amount,
              due_date: invoice.due_date,
              payment_method_selected: invoice.payment_method_selected,
              tripay_va_number: invoice.tripay_va_number,
              tripay_qr_url: invoice.tripay_qr_url,
              tripay_payment_url: invoice.tripay_payment_url,
              tripay_expired_time: invoice.tripay_expired_time,
              tripay_reference: invoice.tripay_reference,
            },
          });
        }
      } catch (error) {
        console.error("Gagal mengambil invoice:", error);
      }

      router.push("/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  const register = async (data: RegisterData) => {
    const response = await api.post("/auth/register", data);
    const { token, client } = response.data.data;

    Cookies.set("token", token, { expires: 7 });
    setUser(client);
    router.push("/dashboard");
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
    setSuspendedData(null);
    router.push("/login");
  };

  const clearSuspendedData = () => {
    setSuspendedData(null);
  };

  const refreshSuspendedData = useCallback(async () => {
    // Refresh for both suspended AND overdue users using utility
    if (user?.status && isAccountRestricted(user.status)) {
      await fetchSuspendedInvoice();
    }
  }, [user?.status, fetchSuspendedInvoice]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        suspendedData,
        login,
        register,
        logout,
        clearSuspendedData,
        refreshSuspendedData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan dalam AuthProvider");
  }
  return context;
};
