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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Invoice } from "@/types";
import { format } from "date-fns";
import { ExternalLink, Plus, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [currentBilling, setCurrentBilling] =
    useState<CurrentBillingData | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchCurrentBilling = useCallback(async () => {
    try {
      const response = await api.get("/billing/current");
      setCurrentBilling(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil data billing:", error);
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
      console.error("Gagal mengambil invoice:", error);
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
      toast.error("Tidak dapat membuat invoice selama periode trial");
      return;
    }

    if (currentBilling.client.total_users === 0) {
      toast.error("Tidak ada pengguna aktif untuk ditagih");
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post("/billing/invoices");

      toast.success("Invoice berhasil dibuat!", {
        description: "Mengarahkan ke halaman pembayaran...",
      });

      // Refresh data
      await fetchInvoices();
      await fetchCurrentBilling();

      // Auto-open checkout URL if available
      if (response.data.data.payment?.checkout_url) {
        window.open(response.data.data.payment.checkout_url, "_blank");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error("Gagal membuat invoice", {
        description: err.response?.data?.error || "Silakan coba lagi nanti",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500",
      paid: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-500",
      expired:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500",
      cancelled:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-500",
    };

    const statusLabel: Record<string, string> = {
      pending: "Menunggu",
      paid: "Lunas",
      overdue: "Terlambat",
      expired: "Kadaluarsa",
      cancelled: "Dibatalkan",
      trial: "Trial",
      active: "Aktif",
      suspended: "Ditangguhkan",
    };

    return (
      <Badge className={variants[status] || ""}>
        {statusLabel[status] || status}
      </Badge>
    );
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      trial: "Trial",
      active: "Aktif",
      suspended: "Ditangguhkan",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tagihan</h1>
          <p className="text-muted-foreground mt-1">
            Kelola langganan platform Anda
          </p>
        </div>

        {currentBilling && currentBilling.client.status !== "trial" && (
          <Button
            onClick={handleGenerateInvoice}
            disabled={
              generating ||
              currentBilling.client.total_users === 0 ||
              currentBilling.client.status === "active" // ADD THIS
            }
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Buat Invoice & Bayar
              </>
            )}
          </Button>
        )}
      </div>

      {/* Suspended Alert */}
      {currentBilling && currentBilling.client.status === "suspended" && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Akun Anda saat ini ditangguhkan. Silakan buat dan bayar invoice Anda
            untuk mengaktifkan kembali akun Anda.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Billing Info */}
      {currentBilling && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className={`text-2xl font-bold capitalize ${
                    currentBilling.client.status === "active"
                      ? "text-green-600"
                      : currentBilling.client.status === "trial"
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  {getStatusLabel(currentBilling.client.status)}
                </div>
                {currentBilling.client.status === "active" && (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-500"
                  >
                    Active
                  </Badge>
                )}
              </div>

              {currentBilling.client.status === "trial" && (
                <p className="text-sm text-gray-500 mt-2">
                  {currentBilling.trial_days_remaining > 0
                    ? `${currentBilling.trial_days_remaining} days remaining`
                    : "Trial ended"}
                </p>
              )}

              {currentBilling.client.status === "active" && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Next billing: 1st of each month
                </p>
              )}

              {currentBilling.client.status === "suspended" && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠ Payment required to reactivate service
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Invoice</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Aksi</TableHead>
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
                    Tidak ada invoice ditemukan
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
                      {invoice.checkout_url && invoice.status === "pending" && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={invoice.checkout_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Bayar Sekarang
                          </a>
                        </Button>
                      )}
                      {invoice.status === "paid" && invoice.paid_at && (
                        <span className="text-sm text-muted-foreground">
                          Dibayar pada{" "}
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
                Sebelumnya
              </Button>
              <span className="flex items-center px-4">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Berikutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
