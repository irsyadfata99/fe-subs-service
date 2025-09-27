"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, Calendar, User, Mail, Phone, Building2, CreditCard } from "lucide-react";
import api from "@/lib/api";

interface EndUser {
  id: number;
  name: string;
  email?: string;
  phone: string | null;
  address?: string | null;
  package_name: string; // ← Tambahkan
  package_price: number; // ← Tambahkan
  billing_cycle?: string; // ← Tambahkan
  status: "active" | "overdue" | "inactive";
  payment_date?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export default function EndUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<EndUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get(`/end-users/${params.id}`);
      setUser(response.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error("Failed to fetch user:", err);
      setError(error.response?.data?.error || "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleMarkAsPaid = async () => {
    if (!user) return;

    setMarkingPaid(true);
    try {
      const response = await api.post(`/end-users/${user.id}/mark-paid`);
      setUser(response.data.data.end_user);
      alert("Payment marked successfully!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error("Error marking as paid:", err);
      alert(error.response?.data?.error || "Failed to mark as paid");
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg text-red-500">{error}</div>
        <Button onClick={() => router.push("/end-users")}>Back to List</Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg">User not found</div>
        <Button onClick={() => router.push("/end-users")}>Back to List</Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "overdue":
        return "bg-red-500";
      case "inactive":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/end-users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Badge className={getStatusColor(user.status)}>{user.status.toUpperCase()}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
            {user.address && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{user.address}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Package</p>
              <p className="font-medium">{user.package_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="font-medium">Rp {user.package_price?.toLocaleString("id-ID")}</p>
            </div>
            {user.billing_cycle && (
              <div>
                <p className="text-sm text-muted-foreground">Billing Cycle</p>
                <p className="font-medium capitalize">{user.billing_cycle}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Last Payment</p>
              <p className="font-medium">{user.payment_date ? new Date(user.payment_date).toLocaleDateString("id-ID") : "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{new Date(user.due_date).toLocaleDateString("id-ID")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleMarkAsPaid} disabled={markingPaid} className="w-full">
              {markingPaid ? "Processing..." : "Mark as Paid"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
