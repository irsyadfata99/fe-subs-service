"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api, { suspendedAccountEvent } from "@/lib/api";
import { Client } from "@/types";

interface SuspendedAccountData {
  status: "suspended";
  reason: "trial_expired" | "payment_overdue" | "account_suspended";
  details?: any;
  invoice?: {
    id: number;
    invoice_number: string;
    amount: number;
    due_date: string;
    payment_url?: string;
    payment_method_selected?: "BCA_VA" | "QRIS" | null;
    tripay_va_number?: string;
    tripay_qr_url?: string;
    tripay_payment_url?: string;
    tripay_expired_time?: string;
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
}

interface RegisterData {
  business_name: string;
  business_type: string;
  email: string;
  password: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [suspendedData, setSuspendedData] =
    useState<SuspendedAccountData | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();

    // Listen for 403 suspended account events from API interceptor
    const handleSuspended = (event: Event) => {
      const customEvent = event as CustomEvent<SuspendedAccountData>;
      console.log("Suspended account event received:", customEvent.detail);
      setSuspendedData(customEvent.detail);
    };

    suspendedAccountEvent.addEventListener(
      "account-suspended",
      handleSuspended
    );

    return () => {
      suspendedAccountEvent.removeEventListener(
        "account-suspended",
        handleSuspended
      );
    };
  }, []);

  const checkAuth = async () => {
    const token = Cookies.get("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      const userData = response.data.data;
      setUser(userData);

      // Check if suspended and fetch invoice
      if (userData.status === "suspended") {
        await fetchSuspendedInvoice();
      }
    } catch (error: any) {
      // If 403 suspended, the interceptor will handle it
      if (error.response?.status !== 403) {
        Cookies.remove("token");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSuspendedInvoice = async () => {
    try {
      const response = await api.get("/billing/invoices", {
        params: { status: "pending", limit: 1 },
      });

      const invoices = response.data.data?.invoices || response.data.data || [];

      if (invoices.length > 0) {
        const invoice = invoices[0];
        setSuspendedData({
          status: "suspended",
          reason:
            user?.status === "trial" ? "trial_expired" : "payment_overdue",
          invoice: {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            amount: invoice.total_amount,
            due_date: invoice.due_date,
            payment_method_selected: invoice.payment_method_selected,
            tripay_va_number: invoice.tripay_va_number,
            tripay_qr_url: invoice.tripay_qr_url,
            tripay_payment_url: invoice.tripay_payment_url,
            tripay_expired_time: invoice.tripay_expired_time,
          },
        });
      }
    } catch (error) {
      console.error("Failed to fetch suspended invoice:", error);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, client } = response.data.data;

    Cookies.set("token", token, { expires: 7 });
    setUser(client);

    // Check if suspended
    if (client.status === "suspended") {
      // Fetch invoice data
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
            reason: "trial_expired", // Will be determined by backend
            invoice: {
              id: invoice.id,
              invoice_number: invoice.invoice_number,
              amount: invoice.total_amount,
              due_date: invoice.due_date,
              payment_method_selected: invoice.payment_method_selected,
              tripay_va_number: invoice.tripay_va_number,
              tripay_qr_url: invoice.tripay_qr_url,
              tripay_payment_url: invoice.tripay_payment_url,
              tripay_expired_time: invoice.tripay_expired_time,
            },
          });
        }
      } catch (error) {
        console.error("Failed to fetch invoice:", error);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
