"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PaymentMethodSelector, { PaymentData } from "@/components/payment/PaymentMethodSelector";
import PaymentDisplay from "@/components/payment/PaymentDisplay";
import InvoiceCard from "@/components/payment/InvoiceCard";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface TrialBannerProps {
  trialEndsAt: string;
  monthlyBill: number;
  pendingInvoice?: {
    id: number;
    invoice_number: string;
    total_amount: number;
    due_date: string;
    payment_method_selected: "BCA_VA" | "QRIS" | null;
    tripay_va_number?: string;
    tripay_qr_url?: string;
    tripay_payment_url?: string;
    tripay_expired_time?: string;
    tripay_reference?: string;
  } | null;
  onPayNow: () => void;
  isLoadingInvoice?: boolean;
}

export default function TrialBanner({ trialEndsAt, monthlyBill, pendingInvoice, isLoadingInvoice = false }: TrialBannerProps) {
  const [daysLeft, setDaysLeft] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"BCA_VA" | "QRIS" | null>(pendingInvoice?.payment_method_selected || null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(
    pendingInvoice
      ? {
          tripay_payment_url: pendingInvoice.tripay_payment_url,
          tripay_va_number: pendingInvoice.tripay_va_number,
          tripay_qr_url: pendingInvoice.tripay_qr_url,
          tripay_expired_time: pendingInvoice.tripay_expired_time,
          tripay_reference: pendingInvoice.tripay_reference,
        }
      : null
  );
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  useEffect(() => {
    const calculateDaysLeft = () => {
      const now = new Date();
      const endDate = new Date(trialEndsAt);
      const diff = endDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysLeft(days);
    };

    calculateDaysLeft();
    const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [trialEndsAt]);

  useEffect(() => {
    if (pendingInvoice) {
      setPaymentMethod(pendingInvoice.payment_method_selected);
      setPaymentData({
        tripay_payment_url: pendingInvoice.tripay_payment_url,
        tripay_va_number: pendingInvoice.tripay_va_number,
        tripay_qr_url: pendingInvoice.tripay_qr_url,
        tripay_expired_time: pendingInvoice.tripay_expired_time,
        tripay_reference: pendingInvoice.tripay_reference,
      });
    }
  }, [pendingInvoice]);

  if (isDismissed || daysLeft > 7) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const billingAmount = pendingInvoice?.total_amount || monthlyBill;

  const handlePayNow = () => {
    const isExpired = paymentData?.tripay_expired_time && new Date(paymentData.tripay_expired_time).getTime() < Date.now();

    if (!pendingInvoice || !paymentMethod || isExpired) {
      if (isExpired) {
        toast.error("Pembayaran telah kadaluarsa. Silakan buat pembayaran baru.");
      }
      setShowPaymentSelector(true);
      setShowPaymentModal(true);
      return;
    }

    if (paymentMethod === "QRIS" && paymentData?.tripay_qr_url) {
      setShowPaymentSelector(false);
      setShowPaymentModal(true);
      return;
    }

    if (paymentMethod === "BCA_VA" && paymentData?.tripay_payment_url) {
      window.open(paymentData.tripay_payment_url, "_blank");
      return;
    }

    setShowPaymentSelector(true);
    setShowPaymentModal(true);
  };

  const handlePaymentCreated = (method: "BCA_VA" | "QRIS", data: PaymentData) => {
    setPaymentMethod(method);
    setPaymentData(data);
    setShowPaymentSelector(false);
    window.location.reload();
  };

  const handleChangeMethod = async () => {
    if (!pendingInvoice) return;

    try {
      await api.post(`/billing/invoices/${pendingInvoice.id}/cancel-payment`);
      setPaymentMethod(null);
      setPaymentData(null);
      setShowPaymentSelector(true);
      toast.success("Pembayaran dibatalkan. Silakan pilih metode lain.");
    } catch (error) {
      console.error("Gagal membatalkan pembayaran:", error);
      toast.error("Gagal membatalkan pembayaran");
    }
  };

  const buttonLabel = paymentMethod ? `Bayar via ${paymentMethod === "BCA_VA" ? "BCA VA" : "QRIS"}` : "Pilih Metode Pembayaran";

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-4 relative">
        <button onClick={() => setIsDismissed(true)} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{daysLeft > 0 ? `Trial berakhir dalam ${daysLeft} hari` : "Trial telah berakhir"}</h3>

            <p className="text-white/90 text-sm mb-3">
              {daysLeft > 0
                ? `Masa trial Anda akan berakhir pada ${new Date(trialEndsAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}. Lakukan pembayaran untuk melanjutkan layanan.`
                : "Silakan lakukan pembayaran untuk mengaktifkan kembali layanan Anda."}
            </p>

            <div className="bg-white/15 rounded-md p-3 mb-3 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/90 text-sm">Tagihan Bulanan:</span>
                <span className="text-xl font-bold">{formatCurrency(billingAmount)}</span>
              </div>
              {pendingInvoice && (
                <div className="mt-1.5 pt-1.5 border-t border-white/20">
                  <span className="text-xs text-white/80">Invoice: {pendingInvoice.invoice_number}</span>
                </div>
              )}
            </div>

            <button onClick={handlePayNow} disabled={isLoadingInvoice} className="px-5 py-2 bg-white text-blue-600 font-semibold rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
              {isLoadingInvoice ? "Memuat..." : buttonLabel}
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{showPaymentSelector ? "Pilih Metode Pembayaran" : "Detail Pembayaran"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {pendingInvoice && <InvoiceCard invoiceNumber={pendingInvoice.invoice_number} totalAmount={pendingInvoice.total_amount} dueDate={pendingInvoice.due_date} compact />}

            {showPaymentSelector && pendingInvoice ? (
              <PaymentMethodSelector invoiceId={pendingInvoice.id} currentMethod={paymentMethod} currentPaymentData={paymentData} onPaymentCreated={handlePaymentCreated} onCancel={() => setShowPaymentModal(false)} isModal />
            ) : (
              paymentMethod &&
              paymentData &&
              pendingInvoice && (
                <PaymentDisplay
                  method={paymentMethod}
                  vaNumber={paymentData.tripay_va_number}
                  qrUrl={paymentData.tripay_qr_url}
                  paymentUrl={paymentData.tripay_payment_url}
                  expiredTime={paymentData.tripay_expired_time}
                  amount={pendingInvoice.total_amount}
                  onChangeMethod={handleChangeMethod}
                  showChangeButton={true}
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
