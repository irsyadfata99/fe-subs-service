import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

interface PendingInvoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  payment_method_selected: "BCA_VA" | "QRIS" | null;
  tripay_reference?: string;
  tripay_payment_url?: string;
  tripay_qr_url?: string;
  tripay_va_number?: string;
  tripay_expired_time?: string;
}

/**
 * Hook to fetch pending invoice for current user
 * Consolidates invoice fetching from multiple components
 * Used by: TrialBanner, ActiveBillingCard, Dashboard
 */
export function usePendingInvoice() {
  const [invoice, setInvoice] = useState<PendingInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/billing/invoices", {
        params: { status: "pending", limit: 1 },
      });

      const invoices = response.data.data?.invoices || response.data.data || [];

      if (invoices.length > 0) {
        setInvoice(invoices[0]);
      } else {
        setInvoice(null);
      }
    } catch (err) {
      console.error("Failed to fetch invoice:", err);
      setError("Failed to load invoice");
      setInvoice(null);
      // Don't show toast - this is a background fetch
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return {
    invoice,
    loading,
    error,
    refetch: fetchInvoice,
  };
}
