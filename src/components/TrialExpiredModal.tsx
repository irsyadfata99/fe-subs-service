"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PaymentMethodSelector, { PaymentData } from "@/components/payment/PaymentMethodSelector";
import PaymentDisplay from "@/components/payment/PaymentDisplay";
import InvoiceCard from "@/components/payment/InvoiceCard";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface PaymentRequiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function PaymentRequiredModal({ isOpen, onClose }: PaymentRequiredModalProps) {
  const { suspendedData, logout, clearSuspendedData, refreshSuspendedData } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<"BCA_VA" | "QRIS" | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const invoice = suspendedData?.invoice;

  // Polling mechanism untuk invoice yang belum ter-generate
  useEffect(() => {
    if (!isOpen || !invoice || invoice.total_amount > 0) {
      setIsPolling(false);
      return;
    }

    console.log("🔄 Invoice belum ready, starting polling...");
    setIsPolling(true);

    const pollInterval = setInterval(async () => {
      console.log("🔄 Polling for invoice update...");
      await refreshSuspendedData();
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [isOpen, invoice, refreshSuspendedData]);

  // Load existing payment data
  useEffect(() => {
    if (invoice?.payment_method_selected) {
      setPaymentMethod(invoice.payment_method_selected);
      setPaymentData({
        tripay_payment_url: invoice.tripay_payment_url,
        tripay_va_number: invoice.tripay_va_number,
        tripay_qr_url: invoice.tripay_qr_url,
        tripay_expired_time: invoice.tripay_expired_time,
        tripay_reference: (invoice as any).tripay_reference, // Type assertion for optional field
      });
      setShowPaymentSelector(false);
    } else {
      setShowPaymentSelector(true);
    }
  }, [invoice]);

  const handlePaymentCreated = async (method: "BCA_VA" | "QRIS", data: PaymentData) => {
    setPaymentMethod(method);
    setPaymentData(data);
    setShowPaymentSelector(false);
    await refreshSuspendedData();
  };

  const handleChangeMethod = async () => {
    if (!invoice) return;

    try {
      await api.post(`/billing/invoices/${invoice.id}/cancel-payment`);
      setPaymentMethod(null);
      setPaymentData(null);
      setShowPaymentSelector(true);
      await refreshSuspendedData();
      toast.success("Pembayaran dibatalkan. Silakan pilih metode lain.");
    } catch (error) {
      console.error("Failed to cancel payment:", error);
      toast.error("Gagal membatalkan pembayaran");
    }
  };

  const handleLogout = () => {
    logout();
    clearSuspendedData();
    if (onClose) onClose();
  };

  const safeAmount = typeof invoice?.total_amount === "number" ? invoice.total_amount : 0;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false} onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Pembayaran Diperlukan</DialogTitle>
              <DialogDescription>Selesaikan pembayaran untuk melanjutkan layanan</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Semua fitur dinonaktifkan hingga pembayaran selesai.</AlertDescription>
          </Alert>

          {invoice && safeAmount > 0 ? (
            <>
              {/* Invoice Details */}
              <InvoiceCard invoiceNumber={invoice.invoice_number} totalAmount={safeAmount} dueDate={invoice.due_date} />

              {/* Payment Method Selector atau Display */}
              {showPaymentSelector ? (
                <PaymentMethodSelector invoiceId={invoice.id} currentMethod={paymentMethod} currentPaymentData={paymentData} onPaymentCreated={handlePaymentCreated} />
              ) : (
                paymentMethod &&
                paymentData && (
                  <PaymentDisplay
                    method={paymentMethod}
                    vaNumber={paymentData.tripay_va_number}
                    qrUrl={paymentData.tripay_qr_url}
                    paymentUrl={paymentData.tripay_payment_url}
                    expiredTime={paymentData.tripay_expired_time}
                    amount={safeAmount}
                    onChangeMethod={handleChangeMethod}
                    showChangeButton={true}
                  />
                )
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isPolling ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Invoice sedang diproses, mohon tunggu...
                  </div>
                ) : (
                  "Invoice sedang dibuat. Silakan refresh halaman dalam beberapa saat."
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2 pt-2 border-t">
          <Button onClick={handleLogout} variant="ghost" className="w-full gap-2" size="sm">
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>

          <p className="text-xs text-center text-muted-foreground">Butuh bantuan? Hubungi support di support@yourplatform.com</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { PaymentRequiredModal as TrialExpiredModal };
