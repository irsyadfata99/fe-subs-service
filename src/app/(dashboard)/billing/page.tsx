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
import { Invoice } from "@/types";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";

// Define proper type for billing data
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

  const fetchCurrentBilling = useCallback(async () => {
    try {
      const response = await api.get("/billing/current");
      setCurrentBilling(response.data.data);
    } catch (error) {
      console.error("Failed to fetch billing:", error);
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
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your platform subscription</p>
      </div>

      {currentBilling && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {currentBilling.client.status}
              </div>
              {currentBilling.client.status === "trial" && (
                <p className="text-sm text-gray-500 mt-1">
                  {currentBilling.trial_days_remaining} days remaining
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentBilling.client.total_users}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Rp 3,000 per user/month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Monthly Estimate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp{" "}
                {currentBilling.monthly_bill_estimate.toLocaleString("id-ID")}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Next billing: 1st of month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
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
                      {invoice.checkout_url && invoice.status === "pending" && (
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
                      {invoice.status === "paid" && invoice.paid_at && (
                        <span className="text-sm text-gray-500">
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
    </div>
  );
}
