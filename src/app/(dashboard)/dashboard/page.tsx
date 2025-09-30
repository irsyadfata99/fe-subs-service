"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Users, AlertCircle, DollarSign } from "lucide-react";
import { DashboardStats, Invoice } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentMethodModal } from "@/components/PaymentMethodModal";
import { QRISModal } from "@/components/QRISModal";
import { format } from "date-fns";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pendingInvoice, setPendingInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRIS, setShowQRIS] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchStats();
    fetchPendingInvoice();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/dashboard/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvoice = async () => {
    try {
      const res = await api.get("/billing/invoices?status=pending&limit=1");
      if (res.data.data.invoices && res.data.data.invoices.length > 0) {
        setPendingInvoice(res.data.data.invoices[0]);
      }
    } catch (error) {
      console.error("Failed to fetch pending invoice:", error);
    }
  };

  const handlePayNow = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
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
      setShowPaymentModal(false);
      setPendingInvoice(updatedInvoice);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Users",
      value: stats.users.total,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Users",
      value: stats.users.active,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Overdue Users",
      value: stats.users.overdue,
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      title: "Monthly Bill",
      value: `Rp ${stats.billing.monthly_bill.toLocaleString("id-ID")}`,
      icon: DollarSign,
      color: "text-purple-600",
    },
  ];

  // Helper function to get trial end date message
  const getTrialEndMessage = () => {
    if (stats.client.trial_days_remaining !== undefined) {
      const daysRemaining = stats.client.trial_days_remaining;
      if (daysRemaining > 0) {
        return `Your trial ends in ${daysRemaining} day${
          daysRemaining !== 1 ? "s" : ""
        }. Please complete payment before trial expires.`;
      }
      return "Your trial has ended. Please complete payment to continue using the service.";
    }
    return "Please complete payment to activate your account.";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {stats.client.business_name}
        </p>
      </div>

      {/* Payment Notification - Static Warning */}
      {(stats.client.status === "trial" ||
        stats.client.status === "suspended") &&
        pendingInvoice && (
          <Alert
            variant={
              stats.client.status === "suspended" ? "destructive" : "default"
            }
            className="mb-6"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="font-semibold">
              {stats.client.status === "trial"
                ? "Trial Account - Payment Required"
                : "Account Suspended"}
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                {stats.client.status === "trial"
                  ? getTrialEndMessage()
                  : `Your account has been suspended. Payment is overdue since ${format(
                      new Date(pendingInvoice.due_date),
                      "dd MMMM yyyy"
                    )}.`}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handlePayNow(pendingInvoice)}
                  variant={
                    stats.client.status === "suspended"
                      ? "destructive"
                      : "default"
                  }
                >
                  Pay Now - Rp{" "}
                  {pendingInvoice.total_amount.toLocaleString("id-ID")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Invoice: {pendingInvoice.invoice_number}
                </span>
              </div>
            </AlertDescription>
          </Alert>
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Reminders Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Sent</span>
                <span className="font-semibold">{stats.reminders.sent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Failed</span>
                <span className="font-semibold text-red-600">
                  {stats.reminders.failed}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold">{stats.reminders.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Status</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingInvoice ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Invoice</span>
                  <span className="font-semibold">
                    {pendingInvoice.invoice_number}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold">
                    Rp {pendingInvoice.total_amount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {pendingInvoice.status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No pending invoice</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Modal */}
      {selectedInvoice && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
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
