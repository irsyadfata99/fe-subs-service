"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Users, Send, DollarSign } from "lucide-react";
import toast from "react-hot-toast";

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
}

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
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvoice, setPendingInvoice] = useState<PendingInvoice | null>(
    null
  );

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch multiple endpoints
      const [statsRes, userRes, endUsersRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/auth/me"),
        api.get("/end-users", { params: { limit: 1000 } }), // ✅ Fetch all end users untuk calculate stats
      ]);

      // Handle response structures
      const statsData = statsRes.data.data || statsRes.data;
      const userData = userRes.data.data || userRes.data;
      const endUsersData =
        endUsersRes.data.data?.end_users || endUsersRes.data.data || [];

      console.log("📊 Stats Response:", statsData);
      console.log("👤 User Response:", userData);
      console.log("👥 End Users Response:", endUsersData);

      // ✅ Calculate accurate stats from end users data
      const totalUsers = endUsersData.length;
      const activeUsers = endUsersData.filter(
        (u: { status: string }) => u.status === "active"
      ).length;

      // Use calculated stats if backend stats are 0
      const finalStats = {
        totalUsers: statsData.totalUsers || totalUsers,
        activeUsers: statsData.activeUsers || activeUsers,
        remindersSentThisMonth: statsData.remindersSentThisMonth || 0,
      };

      console.log("✅ Final Stats:", finalStats);

      setStats(finalStats);
      setUser(userData);

      // Fetch pending invoice if trial user
      if (userData.status === "trial") {
        await checkTrialInvoice();
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error("❌ Failed to load dashboard:", error);
      toast.error(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const checkTrialInvoice = async () => {
    try {
      const response = await api.get("/billing/invoices", {
        params: { status: "pending", limit: 1 },
      });

      const invoices = response.data.data?.invoices || response.data.data || [];

      if (invoices.length > 0) {
        setPendingInvoice(invoices[0]);
        console.log("💰 Pending Invoice:", invoices[0]);
      }
    } catch (error) {
      console.error("Failed to check trial invoice:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.business_name || "User"}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Ini yang terjadi dengan akun anda hari ini.
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium">
                +{stats.activeUsers} active
              </span>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.activeUsers}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {stats.totalUsers > 0
                  ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
                  : 0}
                % of total
              </span>
            </div>
          </div>

          {/* Reminders Sent */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Reminders (This Month)
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.remindersSentThisMonth}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Send className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Automated via WhatsApp
              </span>
            </div>
          </div>

          {/* Monthly Bill */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Monthly Bill
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(
                    pendingInvoice?.total_amount || user?.monthly_bill || 0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Status:{" "}
                {user?.status === "trial" ? "Trial" : user?.status || "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/end-users")}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Manage Users
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add or edit end users
            </p>
          </button>

          <button
            onClick={() => router.push("/reminders")}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Send className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              View Reminders
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Check reminder history
            </p>
          </button>

          <button
            onClick={() => router.push("/billing")}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              Billing
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View invoices and payments
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
