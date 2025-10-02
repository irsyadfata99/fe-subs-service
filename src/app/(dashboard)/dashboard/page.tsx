"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Users, Send, DollarSign } from "lucide-react";
import { toast } from "react-hot-toast";
import ActiveBillingCard from "@/components/ActiveBillingCard";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  remindersSentThisMonth: number;
}

interface User {
  id: number;
  business_name: string;
  status: string;
  trial_ends_at: string;
  monthly_bill: number;
  billing_date?: number;
}

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

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvoice, setPendingInvoice] = useState<PendingInvoice | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch user data (PASTI ADA)
      const userRes = await api.get("/auth/me");
      const userData = userRes.data.data || userRes.data;
      setUser(userData);

      // 2. Fetch end users untuk hitung stats manual
      const endUsersRes = await api.get("/end-users", { params: { limit: 1000 } });
      const endUsersData = endUsersRes.data.data?.end_users || endUsersRes.data.data || [];

      const totalUsers = endUsersData.length;
      const activeUsers = endUsersData.filter((u: { status: string }) => u.status === "active").length;

      // 3. Try fetch reminders stats (optional)
      let remindersSentThisMonth = 0;
      try {
        const remindersRes = await api.get("/reminders", {
          params: {
            status: "sent",
            limit: 1000,
          },
        });
        const remindersData = remindersRes.data.data?.reminders || remindersRes.data.data || [];

        // Filter reminders bulan ini
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        remindersSentThisMonth = remindersData.filter((r: { sent_at: string }) => {
          const sentDate = new Date(r.sent_at);
          return sentDate.getMonth() === thisMonth && sentDate.getFullYear() === thisYear;
        }).length;
      } catch {
        console.log("Could not fetch reminders, using default 0");
      }

      // Set stats
      setStats({
        totalUsers,
        activeUsers,
        remindersSentThisMonth,
      });

      // 4. Fetch pending invoice jika user active atau overdue
      if (userData.status === "active" || userData.status === "overdue") {
        await checkPendingInvoice();
      }
    } catch (error) {
      console.error("Failed to load dashboard:", error);

      // Jangan show error jika 403 (suspended)
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status !== 403) {
        const message = err.response?.data?.message || "Failed to load dashboard";
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const checkPendingInvoice = async () => {
    try {
      const response = await api.get("/billing/invoices", {
        params: { status: "pending", limit: 1 },
      });

      const invoices = response.data.data?.invoices || response.data.data || [];

      if (invoices.length > 0) {
        setPendingInvoice(invoices[0]);
      }
    } catch (error) {
      console.error("Failed to check invoice:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      trial: "Trial",
      active: "Aktif",
      suspended: "Tersuspend",
      overdue: "Terlambat",
    };
    return statusMap[status] || status;
  };

  // Calculate next billing date for active users
  const getNextBillingDate = () => {
    if (!user?.billing_date) {
      // Default 30 hari dari sekarang jika tidak ada billing_date
      return new Date(new Date().setDate(new Date().getDate() + 30)).toISOString();
    }

    const now = new Date();
    const currentDay = now.getDate();
    const billingDay = user.billing_date;

    let nextBilling: Date;

    if (currentDay < billingDay) {
      // Billing date belum lewat bulan ini
      nextBilling = new Date(now.getFullYear(), now.getMonth(), billingDay);
    } else {
      // Billing date sudah lewat, ambil bulan depan
      nextBilling = new Date(now.getFullYear(), now.getMonth() + 1, billingDay);
    }

    return nextBilling.toISOString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Info - Show at top when active user */}
      {user?.status === "active" && <ActiveBillingCard nextBillingDate={getNextBillingDate()} monthlyBill={user.monthly_bill || 0} pendingInvoice={pendingInvoice} onPayNow={() => {}} isLoadingInvoice={false} />}

      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Selamat datang kembali, {user?.business_name || "Pengguna"}!</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Ini yang terjadi dengan akun Anda hari ini.</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pengguna</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium">+{stats.activeUsers} aktif</span>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pengguna Aktif</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.activeUsers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">{stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% dari total</span>
            </div>
          </div>

          {/* Reminders Sent */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pengingat (Bulan Ini)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.remindersSentThisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Send className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Otomatis via WhatsApp</span>
            </div>
          </div>

          {/* Monthly Bill */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tagihan Bulanan</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(pendingInvoice?.total_amount || user?.monthly_bill || 0)}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Status: {user?.status ? getStatusText(user.status) : "N/A"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => router.push("/end-users")} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Kelola Pengguna</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tambah atau edit pengguna akhir</p>
          </button>

          <button onClick={() => router.push("/reminders")} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <Send className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Lihat Pengingat</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Cek riwayat pengingat</p>
          </button>

          <button onClick={() => router.push("/billing")} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
            <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">Tagihan</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Lihat invoice dan pembayaran</p>
          </button>
        </div>
      </div>
    </div>
  );
}
