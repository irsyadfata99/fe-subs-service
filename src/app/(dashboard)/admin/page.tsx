"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Bell, Activity } from "lucide-react";
import { AdminStats } from "@/types";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not super_admin
    if (user && user.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    fetchStats();
  }, [user, router]);

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/stats");
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage the entire platform</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Clients</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients.total}</div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                Trial: {stats.clients.trial}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Active: {stats.clients.active}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Overdue: {stats.clients.overdue}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total End Users</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.end_users.total}</div>
            <p className="text-xs text-muted-foreground mt-2">Across all clients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue This Month</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.revenue.this_month.toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground mt-2">Paid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Reminders Today</CardTitle>
            <Bell className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reminders.today.sent + stats.reminders.today.failed}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs text-green-600">
                Sent: {stats.reminders.today.sent}
              </Badge>
              <Badge variant="outline" className="text-xs text-red-600">
                Failed: {stats.reminders.today.failed}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Database</h3>
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${stats.system.database.status === "healthy" ? "bg-green-500" : "bg-red-500"}`} />
                <span className="text-sm">{stats.system.database.message}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Memory Usage</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RSS:</span>
                  <span className="font-mono">{stats.system.memory.rss}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heap Used:</span>
                  <span className="font-mono">{stats.system.memory.heapUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heap Total:</span>
                  <span className="font-mono">{stats.system.memory.heapTotal}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <button onClick={() => router.push("/admin/clients")} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Manage Clients
          </button>
          <button onClick={() => router.push("/admin/clients")} className="px-4 py-2 border rounded-md hover:bg-accent transition-colors">
            View All Invoices
          </button>
          <button onClick={fetchStats} className="px-4 py-2 border rounded-md hover:bg-accent transition-colors">
            Refresh Stats
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
