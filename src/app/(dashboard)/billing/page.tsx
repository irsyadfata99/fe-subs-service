"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Invoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  due_date: string;
  createdAt: string;
  payment_method_selected: "BCA_VA" | "QRIS" | null;
}

interface ApiResponse {
  success: boolean;
  data: {
    invoices: Invoice[];
  };
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get<ApiResponse>("/billing/invoices");
      setInvoices(data.data.invoices);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat invoice";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: {
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: <Clock className="w-3 h-3" />,
        label: "Pending",
      },
      paid: {
        className:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: <CheckCircle2 className="w-3 h-3" />,
        label: "Paid",
      },
      overdue: {
        className:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: <XCircle className="w-3 h-3" />,
        label: "Overdue",
      },
      cancelled: {
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
        icon: <AlertCircle className="w-3 h-3" />,
        label: "Cancelled",
      },
    };

    const { className, icon, label } =
      config[status as keyof typeof config] || config.pending;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${className}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string | null) => {
    if (!method)
      return (
        <span className="text-gray-500 dark:text-gray-400 text-sm">-</span>
      );

    const config = {
      BCA_VA: {
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        label: "BCA VA",
      },
      QRIS: {
        className:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        label: "QRIS",
      },
    };

    const { className, label } = config[method as keyof typeof config];

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${className}`}
      >
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading invoices...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Billing
        </h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
          Riwayat invoice dan pembayaran Anda
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
            Invoice History
          </h2>
        </div>

        <div className="p-4 md:p-6">
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                Belum ada invoice
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Invoice Number
                    </th>
                    <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Payment Method
                    </th>
                    <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Created
                    </th>
                    <th className="text-left py-3 px-4 text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.invoice_number}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="py-3 px-4">
                        {getPaymentMethodBadge(invoice.payment_method_selected)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(invoice.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(invoice.due_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
