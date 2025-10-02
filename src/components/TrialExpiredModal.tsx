"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, AlertCircle, CreditCard, QrCode, Building2, LogOut, Loader2, FileText, Calendar, DollarSign } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface PaymentRequiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

type PaymentMethod = "BCA_VA" | "QRIS" | null;

interface PaymentData {
  tripay_payment_url?: string;
  tripay_va_number?: string;
  tripay_qr_url?: string;
  tripay_expired_time?: string;
}

export function PaymentRequiredModal({ isOpen, onClose }: PaymentRequiredModalProps) {
  const { suspendedData, logout, clearSuspendedData, refreshSuspendedData } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [isPolling, setIsPolling] = useState(false);

  const invoice = suspendedData?.invoice;

  // Polling mechanism to refresh invoice data
  useEffect(() => {
    if (!isOpen || !invoice || invoice.total_amount > 0) {
      setIsPolling(false);
      return;
    }

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

  // Load existing payment data if available
  useEffect(() => {
    if (invoice?.payment_method_selected) {
      setSelectedMethod(invoice.payment_method_selected);
      setPaymentData({
        tripay_payment_url: invoice.tripay_payment_url,
        tripay_va_number: invoice.tripay_va_number,
        tripay_qr_url: invoice.tripay_qr_url,
        tripay_expired_time: invoice.tripay_expired_time,
      });
    }
  }, [invoice]);

  // Countdown for payment redirect
  useEffect(() => {
    if (!isOpen || !paymentData?.tripay_payment_url) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, paymentData]);

  const handleCreatePayment = async () => {
    if (!selectedMethod || !invoice) {
      toast.error("Pilih metode pembayaran terlebih dahulu");
      return;
    }

    setIsCreatingPayment(true);

    try {
      const response = await api.post(`/billing/invoices/${invoice.id}/create-payment`, {
        payment_method: selectedMethod,
      });

      const result = response.data.data;
      setPaymentData(result.payment);
      await refreshSuspendedData();
      toast.success("Pembayaran berhasil dibuat!");
    } catch (error: unknown) {
      console.error("Failed to create payment:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Gagal membuat pembayaran");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handlePayNow = () => {
    if (paymentData?.tripay_payment_url) {
      window.open(paymentData.tripay_payment_url, "_blank");
    }
  };

  const handleLogout = () => {
    logout();
    clearSuspendedData();
    if (onClose) onClose();
  };

  const handleCancelPayment = async () => {
    if (!invoice) return;

    try {
      await api.post(`/billing/invoices/${invoice.id}/cancel-payment`);
      setSelectedMethod(null);
      setPaymentData(null);
      await refreshSuspendedData();
      toast.success("Pembayaran dibatalkan. Silakan pilih metode lain.");
    } catch (error: unknown) {
      console.error("Failed to cancel payment:", error);
      toast.error("Gagal membatalkan pembayaran");
    }
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
              {/* Invoice Details Card */}
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between pb-3 border-b">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Nomor Invoice</p>
                    <p className="font-mono font-semibold text-sm">{invoice.invoice_number}</p>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Total Tagihan</span>
                  </div>
                  <span className="text-2xl font-bold">Rp {safeAmount.toLocaleString("id-ID")}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Jatuh Tempo</span>
                  </div>
                  <span className="font-medium text-sm">
                    {new Date(invoice.due_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {invoice.payment_method_selected && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Metode Pembayaran</span>
                    <div className="flex items-center gap-2">
                      {invoice.payment_method_selected === "BCA_VA" ? (
                        <>
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">BCA Virtual Account</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="h-4 w-4 text-purple-600" />
                          <span className="font-medium text-sm">QRIS</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              {!paymentData && (
                <div className="space-y-3">
                  <label className="text-sm font-medium">Pilih Metode Pembayaran:</label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedMethod("BCA_VA")}
                      className={`p-4 border-2 rounded-lg transition-all ${selectedMethod === "BCA_VA" ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                    >
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium">BCA Virtual Account</p>
                    </button>

                    <button
                      onClick={() => setSelectedMethod("QRIS")}
                      className={`p-4 border-2 rounded-lg transition-all ${selectedMethod === "QRIS" ? "border-purple-500 bg-purple-50 dark:bg-purple-950" : "border-gray-200 dark:border-gray-700 hover:border-gray-300"}`}
                    >
                      <QrCode className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-sm font-medium">QRIS</p>
                    </button>
                  </div>

                  <Button onClick={handleCreatePayment} disabled={!selectedMethod || isCreatingPayment} className="w-full gap-2" size="lg">
                    {isCreatingPayment ? (
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
              )}

              {/* Payment Info After Method Selected */}
              {paymentData && (
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedMethod === "BCA_VA" ? <Building2 className="h-5 w-5 text-green-600" /> : <QrCode className="h-5 w-5 text-green-600" />}
                      <span className="font-medium text-green-900 dark:text-green-100">{selectedMethod === "BCA_VA" ? "BCA Virtual Account" : "QRIS"}</span>
                    </div>

                    {selectedMethod === "BCA_VA" && paymentData.tripay_va_number && (
                      <div className="mt-2">
                        <p className="text-xs text-green-700 dark:text-green-300">Nomor Virtual Account:</p>
                        <p className="text-lg font-mono font-bold text-green-900 dark:text-green-100">{paymentData.tripay_va_number}</p>
                      </div>
                    )}

                    {paymentData.tripay_expired_time && <p className="text-xs text-green-700 dark:text-green-300 mt-2">Berlaku hingga: {new Date(paymentData.tripay_expired_time).toLocaleString("id-ID")}</p>}
                  </div>

                  <Button onClick={handlePayNow} className="w-full gap-2" size="lg" disabled={countdown > 0}>
                    <CreditCard className="h-5 w-5" />
                    {countdown > 0 ? `Tunggu ${countdown} detik...` : "Bayar Sekarang via Tripay"}
                    <ExternalLink className="h-4 w-4" />
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">Anda akan diarahkan ke halaman pembayaran Tripay</p>

                  <Button onClick={handleCancelPayment} variant="outline" className="w-full" size="sm">
                    Ganti Metode Pembayaran
                  </Button>
                </div>
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
