"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface TrialBannerProps {
  trialEndsAt: string;
  monthlyBill: number;
  pendingInvoice?: {
    id: number;
    invoice_number: string;
    total_amount: number;
    payment_method_selected: "BCA_VA" | "QRIS" | null;
  } | null;
  onPayNow: () => void;
  isLoadingInvoice?: boolean;
}

export default function TrialBanner({
  trialEndsAt,
  monthlyBill,
  pendingInvoice,
  onPayNow,
  isLoadingInvoice = false,
}: TrialBannerProps) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const calculateDaysLeft = () => {
      const now = new Date();
      const endDate = new Date(trialEndsAt);
      const diff = endDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysLeft(days);
    };

    calculateDaysLeft();
    const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [trialEndsAt]);

  if (isDismissed || daysLeft > 7) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const billingAmount = pendingInvoice?.total_amount || monthlyBill;
  const buttonLabel = pendingInvoice?.payment_method_selected
    ? `Bayar via ${
        pendingInvoice.payment_method_selected === "BCA_VA" ? "BCA VA" : "QRIS"
      }`
    : "Pilih Metode Pembayaran";

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-4 relative">
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1">
            {daysLeft > 0
              ? `Trial berakhir dalam ${daysLeft} hari`
              : "Trial telah berakhir"}
          </h3>

          <p className="text-white/90 text-sm mb-3">
            {daysLeft > 0
              ? `Masa trial Anda akan berakhir pada ${new Date(
                  trialEndsAt
                ).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}. Lakukan pembayaran untuk melanjutkan layanan.`
              : "Silakan lakukan pembayaran untuk mengaktifkan kembali layanan Anda."}
          </p>

          <div className="bg-white/15 rounded-md p-3 mb-3 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <span className="text-white/90 text-sm">Tagihan Bulanan:</span>
              <span className="text-xl font-bold">
                {formatCurrency(billingAmount)}
              </span>
            </div>
            {pendingInvoice && (
              <div className="mt-1.5 pt-1.5 border-t border-white/20">
                <span className="text-xs text-white/80">
                  Invoice: {pendingInvoice.invoice_number}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onPayNow}
            disabled={isLoadingInvoice}
            className="px-5 py-2 bg-white text-blue-600 font-semibold rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoadingInvoice ? "Memuat..." : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
