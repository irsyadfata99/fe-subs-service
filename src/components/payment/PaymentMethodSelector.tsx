"use client";

import { useState } from "react";
import { CreditCard, QrCode, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

export interface PaymentData {
  tripay_payment_url?: string;
  tripay_va_number?: string;
  tripay_qr_url?: string;
  tripay_expired_time?: string;
  tripay_reference?: string;
}

interface PaymentMethodSelectorProps {
  invoiceId: number;
  currentMethod?: "BCA_VA" | "QRIS" | null;
  currentPaymentData?: PaymentData | null;
  onPaymentCreated: (method: "BCA_VA" | "QRIS", data: PaymentData) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function PaymentMethodSelector({ invoiceId, currentMethod, currentPaymentData, onPaymentCreated, onCancel, isModal = false }: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<"BCA_VA" | "QRIS" | null>(currentMethod || null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePayment = async () => {
    if (!selectedMethod) {
      toast.error("Pilih metode pembayaran terlebih dahulu");
      return;
    }

    setIsCreating(true);

    try {
      // Check if need to regenerate expired payment
      const isExpired = currentPaymentData?.tripay_expired_time && new Date(currentPaymentData.tripay_expired_time).getTime() < Date.now();

      let response;

      if (currentMethod === selectedMethod && isExpired) {
        // Regenerate expired payment
        response = await api.post(`/billing/invoices/${invoiceId}/regenerate-payment`);
      } else {
        // Create new payment
        response = await api.post(`/billing/invoices/${invoiceId}/create-payment`, {
          payment_method: selectedMethod,
        });
      }

      const result = response.data.data;
      const paymentData: PaymentData = {
        tripay_payment_url: result.invoice?.tripay_payment_url || result.payment?.tripay_payment_url,
        tripay_va_number: result.invoice?.tripay_va_number || result.payment?.tripay_va_number,
        tripay_qr_url: result.invoice?.tripay_qr_url || result.payment?.tripay_qr_url,
        tripay_expired_time: result.invoice?.tripay_expired_time || result.payment?.tripay_expired_time,
        tripay_reference: result.invoice?.tripay_reference || result.payment?.tripay_reference,
      };

      toast.success("Pembayaran berhasil dibuat!");
      onPaymentCreated(selectedMethod, paymentData);
    } catch (error: unknown) {
      console.error("Failed to create payment:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Gagal membuat pembayaran");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-900 dark:text-white block mb-3">Pilih Metode Pembayaran:</label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* BCA Virtual Account */}
          <button
            onClick={() => setSelectedMethod("BCA_VA")}
            disabled={isCreating}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedMethod === "BCA_VA" ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Building2 className={`h-8 w-8 mx-auto mb-2 ${selectedMethod === "BCA_VA" ? "text-blue-600" : "text-gray-600 dark:text-gray-400"}`} />
            <p className="text-sm font-medium text-gray-900 dark:text-white">BCA Virtual Account</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Transfer via ATM/m-banking</p>
          </button>

          {/* QRIS */}
          <button
            onClick={() => setSelectedMethod("QRIS")}
            disabled={isCreating}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedMethod === "QRIS" ? "border-purple-500 bg-purple-50 dark:bg-purple-950" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <QrCode className={`h-8 w-8 mx-auto mb-2 ${selectedMethod === "QRIS" ? "text-purple-600" : "text-gray-600 dark:text-gray-400"}`} />
            <p className="text-sm font-medium text-gray-900 dark:text-white">QRIS</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Scan QR dengan e-wallet</p>
          </button>
        </div>
      </div>

      <div className={`flex gap-3 ${isModal ? "pt-2" : ""}`}>
        {onCancel && (
          <Button onClick={onCancel} disabled={isCreating} variant="outline" className="flex-1">
            Batal
          </Button>
        )}
        <Button onClick={handleCreatePayment} disabled={!selectedMethod || isCreating} className={`gap-2 ${onCancel ? "flex-1" : "w-full"}`} size="lg">
          {isCreating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Membuat Pembayaran...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Buat Pembayaran
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
