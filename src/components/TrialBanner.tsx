"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface TrialBannerProps {
  trialEndsAt: string;
  monthlyBill: number;
  pendingInvoice?: {
    id: number;
    invoice_number: string;
    total_amount: number;
    due_date: string;
    payment_method_selected?: "BCA_VA" | "QRIS";
    checkout_url?: string;
    qr_url?: string;
  } | null;
  onPayNow: () => void;
  isLoadingInvoice?: boolean;
}

export function TrialBanner({
  trialEndsAt,
  monthlyBill,
  pendingInvoice,
  onPayNow,
  isLoadingInvoice = false,
}: TrialBannerProps) {
  const now = new Date();
  const trialEnd = new Date(trialEndsAt);
  const daysRemaining = Math.max(
    0,
    Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Don't show if more than 7 days remaining
  if (daysRemaining > 7) return null;

  const getSeverity = () => {
    if (daysRemaining <= 1) return "error";
    if (daysRemaining <= 3) return "warning";
    return "info";
  };

  const severity = getSeverity();

  const bgColor =
    severity === "error"
      ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
      : severity === "warning"
      ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
      : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";

  const textColor =
    severity === "error"
      ? "text-red-900 dark:text-red-100"
      : severity === "warning"
      ? "text-yellow-900 dark:text-yellow-100"
      : "text-blue-900 dark:text-blue-100";

  const iconColor =
    severity === "error"
      ? "text-red-600 dark:text-red-400"
      : severity === "warning"
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-blue-600 dark:text-blue-400";

  const getMessage = () => {
    if (daysRemaining === 0) return "Trial berakhir hari ini!";
    if (daysRemaining === 1) return "Trial berakhir besok!";
    return `Trial berakhir dalam ${daysRemaining} hari`;
  };

  // Calculate display amount: use invoice if available, fallback to monthlyBill
  const displayAmount = pendingInvoice?.total_amount || monthlyBill;

  return (
    <Alert className={`${bgColor} mb-6`}>
      {daysRemaining <= 1 ? (
        <AlertCircle className={`h-5 w-5 ${iconColor}`} />
      ) : (
        <Clock className={`h-5 w-5 ${iconColor}`} />
      )}
      <AlertTitle className={`font-semibold text-lg ${textColor}`}>
        {getMessage()}
      </AlertTitle>
      <AlertDescription className={`mt-3 ${textColor}`}>
        <div className="space-y-3">
          <p className="font-medium">
            Trial akan berakhir pada{" "}
            <strong>{format(trialEnd, "dd MMMM yyyy")}</strong>. Mohon segera
            lakukan pembayaran sebelum seluruh fungsi tersuspend.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20">
            <div className="flex-1">
              <div className="text-sm opacity-90">Tagihan Anda</div>
              <div className="text-2xl font-bold">
                Rp {displayAmount.toLocaleString("id-ID")}
              </div>
              {isLoadingInvoice && (
                <div className="flex items-center gap-2 text-xs mt-1 opacity-75">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Memproses invoice...</span>
                </div>
              )}
              {!isLoadingInvoice && pendingInvoice && (
                <div className="text-xs mt-1 opacity-75">
                  Invoice: {pendingInvoice.invoice_number}
                  <br />
                  Jatuh tempo:{" "}
                  {format(new Date(pendingInvoice.due_date), "dd MMM yyyy")}
                </div>
              )}
              {!isLoadingInvoice && !pendingInvoice && (
                <div className="text-xs mt-1 opacity-75 text-yellow-600 dark:text-yellow-400">
                  ⚠️ Invoice sedang diproses...
                </div>
              )}
            </div>

            <Button
              onClick={onPayNow}
              size="lg"
              disabled={isLoadingInvoice || !pendingInvoice}
              className={`gap-2 ${
                severity === "error"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {isLoadingInvoice ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Bayar Sekarang
                </>
              )}
            </Button>
          </div>

          {!isLoadingInvoice && !pendingInvoice && (
            <p className="text-sm opacity-75">
              Invoice akan dibuat otomatis. Silakan refresh halaman dalam
              beberapa detik jika belum muncul.
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
