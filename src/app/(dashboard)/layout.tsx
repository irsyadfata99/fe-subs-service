"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import TrialBanner from "@/components/TrialBanner";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";
import PaymentMethodModal from "@/components/modals/PaymentMethodModal";
import QRISModal from "@/components/modals/QRISModal";
import { Shield } from "lucide-react";
import api from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  Bell,
  CreditCard,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { toast } from "sonner";

interface PendingInvoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  payment_method_selected: "BCA_VA" | "QRIS" | null;
  tripay_reference?: string;
  tripay_payment_url?: string;
  tripay_qr_url?: string;
  tripay_va_number?: string;
  tripay_expired_time?: string;
  due_date?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState<PendingInvoice | null>(
    null
  );
  const [loadingInvoice, setLoadingInvoice] = useState(true);

  // Payment modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRIS, setShowQRIS] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchPendingInvoice = async () => {
      if (user && (user.status === "trial" || user.status === "suspended")) {
        try {
          const response = await api.get("/billing/invoices", {
            params: { status: "pending", limit: 1 },
          });
          const invoices = response.data.data.invoices || response.data.data;

          if (invoices.length > 0) {
            setPendingInvoice(invoices[0]);
          } else if (user.status === "trial") {
            const trialDaysRemaining = user.trial_ends_at
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(user.trial_ends_at).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 0;

            if (trialDaysRemaining <= 7) {
              console.log("🔄 Auto-generating trial invoice...");

              try {
                const generateResponse = await api.get(
                  "/billing/check-trial-invoice"
                );

                if (generateResponse.data.data) {
                  setPendingInvoice(generateResponse.data.data);
                  console.log("✅ Invoice generated successfully");
                } else {
                  setTimeout(async () => {
                    const retryResponse = await api.get("/billing/invoices", {
                      params: { status: "pending", limit: 1 },
                    });
                    const retryInvoices =
                      retryResponse.data.data.invoices ||
                      retryResponse.data.data;
                    if (retryInvoices.length > 0) {
                      setPendingInvoice(retryInvoices[0]);
                    }
                  }, 2000);
                }
              } catch (genError) {
                console.error("Failed to generate invoice:", genError);
                toast.error("Failed to generate invoice. Please refresh.");
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch pending invoice:", error);
        } finally {
          setLoadingInvoice(false);
        }
      } else {
        setLoadingInvoice(false);
      }
    };

    if (user) {
      fetchPendingInvoice();
    }
  }, [user]);

  const handlePayNow = async () => {
    if (!pendingInvoice) {
      toast.error("Invoice tidak ditemukan");
      return;
    }

    console.log("🔍 Debug Payment:", {
      invoice_id: pendingInvoice.id,
      payment_method: pendingInvoice.payment_method_selected,
      expired_at: pendingInvoice.tripay_expired_time,
      checkout_url: pendingInvoice.tripay_payment_url,
      qr_url: pendingInvoice.tripay_qr_url,
    });

    // Check if payment expired
    const now = Date.now();
    const expiredTime = pendingInvoice.tripay_expired_time
      ? new Date(pendingInvoice.tripay_expired_time).getTime()
      : 0;
    const isExpired = !pendingInvoice.tripay_expired_time || expiredTime < now;

    console.log("⏰ Expiry Check:", {
      expired_at: pendingInvoice.tripay_expired_time,
      expiredTime: new Date(expiredTime).toISOString(),
      now: new Date(now).toISOString(),
      isExpired,
    });

    // Always show modal if no payment method OR expired
    if (!pendingInvoice.payment_method_selected || isExpired) {
      console.log("✅ Showing payment modal");
      setShowPaymentModal(true);
      return;
    }

    // If QRIS with valid QR
    if (
      pendingInvoice.payment_method_selected === "QRIS" &&
      pendingInvoice.tripay_qr_url
    ) {
      console.log("✅ Showing QRIS modal");
      setShowQRIS(true);
      return;
    }

    // If BCA VA with valid checkout URL
    if (
      pendingInvoice.payment_method_selected === "BCA_VA" &&
      pendingInvoice.tripay_payment_url
    ) {
      console.log("✅ Opening BCA VA URL");
      window.open(pendingInvoice.tripay_payment_url, "_blank");
      return;
    }

    // Fallback: show modal
    console.log("⚠️ Fallback: showing modal");
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = async (method: "BCA_VA" | "QRIS") => {
    if (!pendingInvoice) return;

    try {
      // Check if payment expired
      const isExpired =
        pendingInvoice.tripay_expired_time &&
        new Date(pendingInvoice.tripay_expired_time).getTime() < Date.now();

      let response;

      // If payment method same and expired, regenerate
      if (pendingInvoice.payment_method_selected === method && isExpired) {
        response = await api.post(
          `/billing/invoices/${pendingInvoice.id}/regenerate-payment`
        );
      } else {
        // Create new payment
        response = await api.post(
          `/billing/invoices/${pendingInvoice.id}/create-payment`,
          {
            payment_method: method,
          }
        );
      }

      const updatedInvoice = response.data.data.invoice;
      setShowPaymentModal(false);
      setPendingInvoice(updatedInvoice);

      if (method === "QRIS") {
        setShowQRIS(true);
      } else if (updatedInvoice.tripay_payment_url) {
        window.open(updatedInvoice.tripay_payment_url, "_blank");
        toast.success("Redirecting to payment page...");
      }
    } catch {
      toast.error("Failed to create payment");
    }
  };

  if (loading || loadingInvoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "End Users", href: "/end-users", icon: Users },
    { name: "Reminders", href: "/reminders", icon: Bell },
    ...(user.role === "client"
      ? [{ name: "Billing", href: "/billing", icon: CreditCard }]
      : []),
    { name: "Settings", href: "/settings", icon: Settings },
    ...(user.role === "super_admin"
      ? [{ name: "Admin Panel", href: "/admin", icon: Shield }]
      : []),
  ];

  const trialDaysRemaining = user.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(user.trial_ends_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Trial Expired Modal */}
        {user.status === "suspended" && (
          <TrialExpiredModal
            isOpen={true}
            invoiceUrl={pendingInvoice?.tripay_payment_url}
            amount={pendingInvoice?.total_amount || user.monthly_bill}
            dueDate={pendingInvoice?.due_date}
          />
        )}

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <div className="p-6">
            <h1 className="text-xl font-bold">Payment Reminder</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user.business_name}
            </p>
          </div>

          <nav className="px-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:pl-64">
          {/* Header */}
          <header className="bg-card border-b border-border sticky top-0 z-30">
            <div className="flex items-center justify-between px-6 py-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
              <div className="flex-1" />
              <div className="flex items-center gap-4">
                <ThemeToggle />
                {user.status === "trial" && (
                  <div className="text-sm hidden sm:block">
                    <span className="text-muted-foreground">Trial: </span>
                    <span className="font-medium text-primary">
                      {trialDaysRemaining} days left
                    </span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            {/* ✅ HANYA TAMPILKAN TRIAL BANNER DI SINI (LAYOUT) UNTUK SEMUA PAGE */}
            {user.status === "trial" && (
              <div className="mb-6">
                <TrialBanner
                  trialEndsAt={user.trial_ends_at}
                  monthlyBill={
                    typeof user.monthly_bill === "number"
                      ? user.monthly_bill
                      : 0
                  }
                  pendingInvoice={pendingInvoice}
                  onPayNow={handlePayNow}
                  isLoadingInvoice={loadingInvoice}
                />
              </div>
            )}

            {children}
          </main>
        </div>

        {/* Payment Method Modal */}
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSelectMethod={handlePaymentMethodSelect}
          isLoading={false}
        />

        {/* QRIS Modal */}
        {pendingInvoice &&
          pendingInvoice.tripay_qr_url &&
          pendingInvoice.tripay_expired_time && (
            <QRISModal
              isOpen={showQRIS}
              onClose={() => setShowQRIS(false)}
              qrUrl={pendingInvoice.tripay_qr_url}
              amount={pendingInvoice.total_amount}
              expiredTime={pendingInvoice.tripay_expired_time}
              reference={pendingInvoice.tripay_reference || ""}
              invoiceNumber={pendingInvoice.invoice_number}
            />
          )}
      </div>
    </ErrorBoundary>
  );
}
