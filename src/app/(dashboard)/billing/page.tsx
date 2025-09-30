"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Invoice } from "@/types";
import { format } from "date-fns";
import { ExternalLink, Plus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PaymentMethodModal } from "@/components/PaymentMethodModal";
import { QRISModal } from "@/components/QRISModal";

interface CurrentBillingData {
  client: {
    status: string;
    total_users: number;
  };
  trial_days_remaining: number;
  monthly_bill_estimate: number;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentBilling, setCurrentBillingData] = useState<CurrentBillingData | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

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

  const handleGenerateInvoice = async () => {
    if (!currentBilling) return;

    if (currentBilling.client.status === "trial") {
      toast.error("Cannot create invoice during trial period");
      return;
    }

    if (currentBilling.client.total_users === 0) {
      toast.error("No active users to bill");
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post("/billing/invoices");

      toast.success("Invoice created!");

      // Refresh data
      await fetchInvoices();
      await fetchCurrentBilling();

      // Get the new invoice and show payment modal
      const newInvoice = response.data.data.invoice;
      setSelectedInvoice(newInvoice);
      setShowPaymentMethod(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error("Failed to create invoice", {
        description: err.response?.data?.error || "Please try again",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePaymentMethodSelect = async (method: "BCA_VA" | "QRIS") => {
    if (!selectedInvoice) return;

    try {
      const response = await api.post(`/billing/invoices/${selectedInvoice.id}/payment`, {
        payment_method: method,
      });

      const updatedInvoice = response.data.data.invoice;

      // Close payment method modal
      setShowPaymentMethod(false);

      // Update invoice in list
      setInvoices((prev) => prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv)));

      if (method === "QRIS") {
        // Show QRIS modal
        setSelectedInvoice(updatedInvoice);
        setShowQRIS(true);
      } else {
        // Open BCA VA in new tab
        if (updatedInvoice.checkout_url) {
          window.open(updatedInvoice.checkout_url, "_blank");
        }
        toast.success("Redirecting to payment page...");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error("Failed to create payment", {
        description: err.response?.data?.error,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500",
      paid: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500",
      expired: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500",
    };

    const statusLabel: Record<string, string> = {
      pending: "Pending",
      paid: "Paid",
      overdue: "Overdue",
      expired: "Expired",
      cancelled: "Cancelled",
    };

    return <Badge className={variants[status] || ""}>{statusLabel[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground mt-1">Manage your platform subscription</p>
        </div>

        {currentBilling && currentBilling.client.status !== "trial" && (
          <Button onClick={handleGenerateInvoice} disabled={generating || currentBilling.client.total_users === 0 || currentBilling.client.status === "active"} size="lg">
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice & Pay
              </>
            )}
          </Button>
        )}
      </div>

      {/* Suspended Alert */}
      {currentBilling && currentBilling.client.status === "suspended" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Your account is suspended. Please create and pay your invoice to reactivate your account.</AlertDescription>
        </Alert>
      )}

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
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{format(new Date(invoice.period_year, invoice.period_month - 1), "MMM yyyy")}</TableCell>
                    <TableCell>{invoice.total_users}</TableCell>
                    <TableCell>Rp {invoice.total_amount.toLocaleString("id-ID")}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{format(new Date(invoice.due_date), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      {invoice.status === "pending" && !invoice.payment_method_selected && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowPaymentMethod(true);
                          }}
                        >
                          Pay Now
                        </Button>
                      )}
                      {invoice.status === "pending" && invoice.payment_method_selected === "BCA_VA" && invoice.checkout_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={invoice.checkout_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Pay Now
                          </a>
                        </Button>
                      )}
                      {invoice.status === "pending" && invoice.payment_method_selected === "QRIS" && invoice.qr_url && (
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
                      {invoice.status === "paid" && invoice.paid_at && <span className="text-sm text-muted-foreground">Paid on {format(new Date(invoice.paid_at), "dd MMM yyyy")}</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Modal */}
      {selectedInvoice && (
        <PaymentMethodModal isOpen={showPaymentMethod} onClose={() => setShowPaymentMethod(false)} onSelect={handlePaymentMethodSelect} amount={selectedInvoice.total_amount} invoiceNumber={selectedInvoice.invoice_number} />
      )}

      {/* QRIS Modal */}
      {selectedInvoice && selectedInvoice.qr_url && selectedInvoice.expired_at && (
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
