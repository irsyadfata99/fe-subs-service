"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TrialBanner } from "@/components/TrialBanner";
import { TrialExpiredModal } from "@/components/TrialExpiredModal";
import { PaymentMethodModal } from "@/components/PaymentMethodModal";
import { QRISModal } from "@/components/QRISModal";
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
  checkout_url?: string;
  total_amount: number;
  due_date: string;
  payment_method_selected?: "BCA_VA" | "QRIS";
  qr_url?: string;
  expired_at?: string;
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

  // Fetch pending invoice - ALWAYS for trial and suspended
  // Fetch pending invoice - with auto-generation for trial
  useEffect(() => {
    const fetchPendingInvoice = async () => {
      if (user && (user.status === "trial" || user.status === "suspended")) {
        try {
          // First, try to get existing invoice
          const response = await api.get("/billing/invoices", {
            params: { status: "pending", limit: 1 },
          });
          const invoices = response.data.data.invoices || response.data.data;

          if (invoices.length > 0) {
            setPendingInvoice(invoices[0]);
          } else if (user.status === "trial") {
            // If no invoice but in trial, check if we need to generate
            const trialDaysRemaining = user.trial_ends_at
              ? Math.max(
                  0,
                  Math.ceil(
                    (new Date(user.trial_ends_at).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )
                )
              : 0;

            // Auto-generate invoice if H-7 or less
            if (trialDaysRemaining <= 7) {
              console.log("🔄 Auto-generating trial invoice...");

              try {
                // Call check endpoint to generate invoice
                const generateResponse = await api.get(
                  "/billing/check-trial-invoice"
                );

                if (generateResponse.data.data) {
                  setPendingInvoice(generateResponse.data.data);
                  console.log("✅ Invoice generated successfully");
                } else {
                  // Retry fetch after generation
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

  const handlePayNow = () => {
    if (pendingInvoice) {
      // If payment method already selected
      if (
        pendingInvoice.payment_method_selected === "QRIS" &&
        pendingInvoice.qr_url
      ) {
        setShowQRIS(true);
      } else if (
        pendingInvoice.payment_method_selected === "BCA_VA" &&
        pendingInvoice.checkout_url
      ) {
        window.open(pendingInvoice.checkout_url, "_blank");
      } else {
        // Show payment method selection
        setShowPaymentModal(true);
      }
    } else {
      toast.error("Invoice belum tersedia. Mohon refresh halaman.");
    }
  };

  const handlePaymentMethodSelect = async (method: "BCA_VA" | "QRIS") => {
    if (!pendingInvoice) return;

    try {
      const response = await api.post(
        `/billing/invoices/${pendingInvoice.id}/pay`,
        {
          payment_method: method,
        }
      );

      const updatedInvoice = response.data.data.invoice;
      setShowPaymentModal(false);
      setPendingInvoice(updatedInvoice);

      if (method === "QRIS") {
        setShowQRIS(true);
      } else if (updatedInvoice.checkout_url) {
        window.open(updatedInvoice.checkout_url, "_blank");
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
        {user.status === "suspended" && (
          <TrialExpiredModal
            isOpen={true}
            invoiceUrl={pendingInvoice?.checkout_url}
            amount={pendingInvoice?.total_amount || user.monthly_bill}
            dueDate={pendingInvoice?.due_date}
          />
        )}

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

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

        <div className="lg:pl-64">
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

          <main className="p-6">
            {user.status === "trial" && (
              <TrialBanner
                trialEndsAt={user.trial_ends_at}
                monthlyBill={
                  typeof user.monthly_bill === "number" ? user.monthly_bill : 0
                }
                pendingInvoice={pendingInvoice}
                onPayNow={handlePayNow}
                isLoadingInvoice={loadingInvoice}
              />
            )}

            {children}
          </main>
        </div>

        {/* Payment Modals */}
        {pendingInvoice && (
          <>
            <PaymentMethodModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              onSelect={handlePaymentMethodSelect}
              amount={pendingInvoice.total_amount}
              invoiceNumber={pendingInvoice.invoice_number}
            />

            {pendingInvoice.qr_url && pendingInvoice.expired_at && (
              <QRISModal
                isOpen={showQRIS}
                onClose={() => setShowQRIS(false)}
                invoiceId={pendingInvoice.id}
                invoiceNumber={pendingInvoice.invoice_number}
                amount={pendingInvoice.total_amount}
                qrUrl={pendingInvoice.qr_url}
                expiredAt={pendingInvoice.expired_at}
              />
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
