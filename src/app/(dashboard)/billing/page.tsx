"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Invoice } from "@/types";
import { format } from "date-fns";
import { ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PaymentMethodModal } from "@/components/PaymentMethodModal";
import { QRISModal } from "@/components/QRISModal";
import { AxiosError } from "axios";

interface CurrentBillingData {
  client: {
    status: string;
    total_users: number;
    billing_date: number;
  };
  trial_days_remaining: number;
  monthly_bill_estimate: number;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentBilling, setCurrentBillingData] =
    useState<CurrentBillingData | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Payment modals
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [showQRIS, setShowQRIS] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchCurrentBilling = useCallback(async () => {
    try {
      const response = await api.get("/billing/current");
      setCurrentBillingData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/billing/invoices", {
        params: { page, limit: 10 },
      });
      setInvoices(response.data.data.invoices || response.data.data);
      setTotalPages(response.data.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchCurrentBilling();
    fetchInvoices();
  }, [fetchCurrentBilling, fetchInvoices]);

  const handlePayNow = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentMethod(true);
  };

  const handlePaymentMethodSelect = async (method: "BCA_VA" | "QRIS") => {
    if (!selectedInvoice) return;

    try {
      const response = await api.post(
        `/billing/invoices/${selectedInvoice.id}/pay`,
        {
          payment_method: method,
        }
      );

      const updatedInvoice = response.data.data.invoice;
      setShowPaymentMethod(false);
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
      );

      if (method === "QRIS") {
        setSelectedInvoice(updatedInvoice);
        setShowQRIS(true);
      } else {
        if (updatedInvoice.checkout_url) {
          window.open(updatedInvoice.checkout_url, "_blank");
        }
        toast.success("Redirecting to payment page...");
      }
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      toast.error(error.response?.data?.message || "Failed to create payment");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your platform subscription
          </p>
        </div>
      </div>

      {/* Suspended Alert */}
      {/* {currentBilling && currentBilling.client.status === "suspended" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Akun Anda tersuspend. Silakan bayar invoice untuk mengaktifkan
            kembali.
          </AlertDescription>
        </Alert>
      )} */}

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(invoice.period_year, invoice.period_month - 1),
                        "MMM yyyy"
                      )}
                    </TableCell>
                    <TableCell>{invoice.total_users}</TableCell>
                    <TableCell>
                      Rp {invoice.total_amount.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.due_date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {invoice.status === "pending" &&
                        !invoice.payment_method_selected && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePayNow(invoice)}
                          >
                            Pay Now
                          </Button>
                        )}
                      {invoice.status === "pending" &&
                        invoice.payment_method_selected === "BCA_VA" &&
                        invoice.checkout_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={invoice.checkout_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Pay Now
                            </a>
                          </Button>
                        )}
                      {invoice.status === "pending" &&
                        invoice.payment_method_selected === "QRIS" &&
                        invoice.qr_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setShowQRIS(true);
                            }}
                          >
                            View QR
                          </Button>
                        )}
                      {invoice.status === "paid" && invoice.paid_at && (
                        <span className="text-sm text-muted-foreground">
                          Paid on{" "}
                          {format(new Date(invoice.paid_at), "dd MMM yyyy")}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Modal */}
      {selectedInvoice && (
        <PaymentMethodModal
          isOpen={showPaymentMethod}
          onClose={() => setShowPaymentMethod(false)}
          onSelect={handlePaymentMethodSelect}
          amount={selectedInvoice.total_amount}
          invoiceNumber={selectedInvoice.invoice_number}
        />
      )}

      {/* QRIS Modal */}
      {selectedInvoice &&
        selectedInvoice.qr_url &&
        selectedInvoice.expired_at && (
          <QRISModal
            isOpen={showQRIS}
            onClose={() => setShowQRIS(false)}
            invoiceId={selectedInvoice.id}
            invoiceNumber={selectedInvoice.invoice_number}
            amount={selectedInvoice.total_amount}
            qrUrl={selectedInvoice.qr_url}
            expiredAt={selectedInvoice.expired_at}
          />
        )}
    </div>
  );
}
