"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import TrialBanner from "@/components/TrialBanner";
import { PaymentRequiredModal } from "@/components/TrialExpiredModal";
import { Shield } from "lucide-react";
import api from "@/lib/api";
import { LayoutDashboard, Users, Bell, CreditCard, Settings, LogOut, Menu } from "lucide-react";

interface PendingInvoice {
  id: number;
  invoice_number: string;
  total_amount: number;
  due_date: string;
  payment_method_selected: "BCA_VA" | "QRIS" | null;
  tripay_reference?: string;
  tripay_payment_url?: string;
  tripay_qr_url?: string;
  tripay_va_number?: string;
  tripay_expired_time?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState<PendingInvoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // FIXED: Fetch pending invoice for trial users
  useEffect(() => {
    const userId = user?.id;
    const userStatus = user?.status;

    if (!userId || !userStatus) {
      setLoadingInvoice(false);
      return;
    }

    const fetchPendingInvoice = async () => {
      if (userStatus === "trial") {
        try {
          const response = await api.get("/billing/invoices", {
            params: { status: "pending", limit: 1 },
          });
          const invoices = response.data.data.invoices || response.data.data;

          if (invoices.length > 0) {
            setPendingInvoice(invoices[0]);
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

    fetchPendingInvoice();
  }, [user?.id, user?.status]);

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
    ...(user.role === "client" ? [{ name: "Billing", href: "/billing", icon: CreditCard }] : []),
    { name: "Settings", href: "/settings", icon: Settings },
    ...(user.role === "super_admin" ? [{ name: "Admin Panel", href: "/admin", icon: Shield }] : []),
  ];

  const trialDaysRemaining = user.trial_ends_at ? Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        {/* Payment Required Modal - ONLY show when user.status === "suspended" */}
        {user.status === "suspended" && <PaymentRequiredModal isOpen={true} />}

        {/* Sidebar Overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Sidebar */}
        <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
          <div className="p-6">
            <h1 className="text-xl font-bold">Payment Reminder</h1>
            <p className="text-sm text-muted-foreground mt-1">{user.business_name}</p>
          </div>

          <nav className="px-4 space-y-1">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors" onClick={() => setSidebarOpen(false)}>
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <Button variant="ghost" className="w-full justify-start" onClick={logout}>
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
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6" />
              </Button>
              <div className="flex-1" />
              <div className="flex items-center gap-4">
                <ThemeToggle />
                {user.status === "trial" && (
                  <div className="text-sm hidden sm:block">
                    <span className="text-muted-foreground">Trial: </span>
                    <span className="font-medium text-primary">{trialDaysRemaining} days left</span>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            {/* Trial Banner - Only show for trial users with valid trial_ends_at */}
            {user.status === "trial" && user.trial_ends_at && (
              <div className="mb-6">
                <TrialBanner trialEndsAt={user.trial_ends_at} monthlyBill={typeof user.monthly_bill === "number" ? user.monthly_bill : 0} pendingInvoice={pendingInvoice} onPayNow={() => {}} isLoadingInvoice={loadingInvoice} />
              </div>
            )}

            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
