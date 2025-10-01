"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Calendar, DollarSign, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import PaymentMethodModal from "@/components/modals/PaymentMethodModal";
import BCAVAModal from "@/components/modals/BCAVAModal";
import QRISModal from "@/components/modals/QRISModal";

interface Invoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  due_date: string;
  created_at: string;
  payment_method_selected: "BCA_VA" | "QRIS" | null;
  tripay_reference?: string;
  tripay_payment_url?: string;
  tripay_qr_url?: string;
  tripay_va_number?: string;
  tripay_expired_time?: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    invoices: Invoice[];
  };
}

interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    invoice: Invoice;
    payment: {
      tripay_reference: string;
      tripay_payment_url: string;
      tripay_qr_url: string | null;
      tripay_va_number: string | null;
      tripay_expired_time: string;
    };
  };
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Modal states
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showBCAModal, setShowBCAModal] = useState(false);
  const [showQRISModal, setShowQRISModal] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get<ApiResponse>("/billing/invoices");
      setInvoices(data.data.invoices);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load invoices";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = (invoice: Invoice) => {
    setSelectedInvoice(invoice);

    // Check if payment method already selected
    if (invoice.payment_method_selected) {
      // Check if payment expired
      if (invoice.tripay_expired_time && new Date(invoice.tripay_expired_time) < new Date()) {
        // Payment expired - treat as new payment
        setShowPaymentMethodModal(true);
      } else {
        // Valid payment exists - show respective modal
        if (invoice.payment_method_selected === "BCA_VA") {
          setShowBCAModal(true);
        } else {
          setShowQRISModal(true);
        }
      }
    } else {
      // No payment method selected yet - show selection modal
      setShowPaymentMethodModal(true);
    }
  };

  const handleSelectPaymentMethod = async (method: "BCA_VA" | "QRIS") => {
    if (!selectedInvoice) return;

    setProcessingPayment(true);
    try {
      const { data } = await api.post<PaymentResponse>(`/billing/invoices/${selectedInvoice.id}/create-payment`, {
        payment_method: method,
      });

      toast.success("Payment berhasil dibuat!");

      // Close payment method modal
      setShowPaymentMethodModal(false);

      // Update selected invoice with new payment data
      setSelectedInvoice({
        ...selectedInvoice,
        payment_method_selected: method,
        tripay_reference: data.data.payment.tripay_reference,
        tripay_payment_url: data.data.payment.tripay_payment_url,
        tripay_qr_url: data.data.payment.tripay_qr_url || undefined,
        tripay_va_number: data.data.payment.tripay_va_number || undefined,
        tripay_expired_time: data.data.payment.tripay_expired_time,
      });

      // Open respective payment modal
      if (method === "BCA_VA") {
        // Redirect to Tripay for BCA VA
        if (data.data.payment.tripay_payment_url) {
          window.open(data.data.payment.tripay_payment_url, "_blank");
        }
        setShowBCAModal(true);
      } else {
        setShowQRISModal(true);
      }

      // Refresh invoices list
      fetchInvoices();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create payment";
      toast.error(message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };

    const icons = {
      pending: <Clock className="w-4 h-4" />,
      paid: <CheckCircle2 className="w-4 h-4" />,
      overdue: <XCircle className="w-4 h-4" />,
      cancelled: <AlertCircle className="w-4 h-4" />,
    };

    const labels = {
      pending: "Pending",
      paid: "Paid",
      overdue: "Overdue",
      cancelled: "Cancelled",
    };

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string | null) => {
    if (!method) return null;

    const styles = {
      BCA_VA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      QRIS: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    };

    return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${styles[method as keyof typeof styles]}`}>{method === "BCA_VA" ? "BCA Virtual Account" : "QRIS"}</span>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isPaymentExpired = (invoice: Invoice) => {
    if (!invoice.tripay_expired_time) return false;
    return new Date(invoice.tripay_expired_time) < new Date();
  };

  const getButtonLabel = (invoice: Invoice) => {
    if (!invoice.payment_method_selected) {
      return "Pilih Metode Pembayaran";
    }

    if (isPaymentExpired(invoice)) {
      return "Payment Expired - Pilih Lagi";
    }

    return `Bayar via ${invoice.payment_method_selected === "BCA_VA" ? "BCA VA" : "QRIS"}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Kelola invoice dan pembayaran Anda</p>
      </div>

      {/* Invoices List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Invoice History</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Belum ada invoice</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{invoice.invoice_number}</h3>
                      {getStatusBadge(invoice.status)}
                      {getPaymentMethodBadge(invoice.payment_method_selected)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.total_amount)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {formatDate(invoice.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Created: {formatDate(invoice.created_at)}</span>
                      </div>
                    </div>

                    {isPaymentExpired(invoice) && invoice.status === "pending" && (
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-900 dark:text-yellow-300">Payment Expired</p>
                          <p className="text-yellow-700 dark:text-yellow-400">Pembayaran sebelumnya telah kadaluarsa. Silakan buat pembayaran baru.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {invoice.status === "pending" && (
                      <button onClick={() => handlePayNow(invoice)} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm whitespace-nowrap">
                        {getButtonLabel(invoice)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Method Selection Modal */}
      <PaymentMethodModal
        isOpen={showPaymentMethodModal}
        onClose={() => {
          setShowPaymentMethodModal(false);
          setSelectedInvoice(null);
        }}
        onSelectMethod={handleSelectPaymentMethod}
        isLoading={processingPayment}
      />

      {/* BCA VA Modal */}
      {selectedInvoice && (
        <BCAVAModal
          isOpen={showBCAModal}
          onClose={() => {
            setShowBCAModal(false);
            setSelectedInvoice(null);
            fetchInvoices();
          }}
          vaNumber={selectedInvoice.tripay_va_number || ""}
          amount={selectedInvoice.total_amount}
          expiredTime={selectedInvoice.tripay_expired_time || ""}
          paymentUrl={selectedInvoice.tripay_payment_url || ""}
          invoiceNumber={selectedInvoice.invoice_number}
        />
      )}

      {/* QRIS Modal */}
      {selectedInvoice && (
        <QRISModal
          isOpen={showQRISModal}
          onClose={() => {
            setShowQRISModal(false);
            setSelectedInvoice(null);
            fetchInvoices();
          }}
          qrUrl={selectedInvoice.tripay_qr_url || ""}
          amount={selectedInvoice.total_amount}
          expiredTime={selectedInvoice.tripay_expired_time || ""}
          reference={selectedInvoice.tripay_reference || ""}
          invoiceNumber={selectedInvoice.invoice_number}
        />
      )}
    </div>
  );
}
