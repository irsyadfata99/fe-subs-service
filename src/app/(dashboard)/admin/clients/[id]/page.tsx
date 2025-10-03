"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, DollarSign, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ClientDetail {
  id: number;
  business_name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  total_users: number;
  monthly_bill: number;
  trial_ends_at: string;
  created_at: string;
  last_active_at: string;
}

interface EndUser {
  id: number;
  name: string;
  phone: string;
  package_name: string;
  package_price: number;
  status: string;
  due_date: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  period_month: number;
  period_year: number;
  total_amount: number;
  status: string;
  due_date: string;
  paid_at: string;
}

interface Reminder {
  id: number;
  type: string;
  status: string;
  sent_at: string;
  end_user: {
    name: string;
  };
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [endUsers, setEndUsers] = useState<EndUser[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchClientData = useCallback(async () => {
    try {
      const response = await api.get(`/admin/clients/${params.id}`);
      setClient(response.data.data);
    } catch (error) {
      toast.error("Gagal memuat data klien");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchTabData = useCallback(
    async (tab: string) => {
      if (tab === "end-users" && endUsers.length === 0) {
        try {
          const response = await api.get(
            `/admin/clients/${params.id}/end-users`
          );
          setEndUsers(response.data.data);
        } catch (error) {
          console.error("Failed to fetch end users");
          toast.error("Gagal memuat data end users");
        }
      } else if (tab === "invoices" && invoices.length === 0) {
        try {
          const response = await api.get(
            `/admin/clients/${params.id}/invoices`
          );
          setInvoices(response.data.data);
        } catch (error) {
          console.error("Failed to fetch invoices");
          toast.error("Gagal memuat data invoice");
        }
      } else if (tab === "reminders" && reminders.length === 0) {
        try {
          const response = await api.get(
            `/admin/clients/${params.id}/reminders`
          );
          setReminders(response.data.data);
        } catch (error) {
          console.error("Failed to fetch reminders");
          toast.error("Gagal memuat data reminders");
        }
      }
    },
    [params.id, endUsers.length, invoices.length, reminders.length]
  );

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  useEffect(() => {
    if (activeTab !== "overview") {
      fetchTabData(activeTab);
    }
  }, [activeTab, fetchTabData]);

  const handleDeleteClient = async () => {
    if (!client) return;

    const isTrial = client.status === "trial";
    const confirmMsg = isTrial
      ? `Permanently delete "${client.business_name}"? This cannot be undone.`
      : `This will mark "${client.business_name}" as inactive. Continue?`;

    if (!confirm(confirmMsg)) return;

    try {
      await api.delete(`/admin/clients/${client.id}`);
      toast.success(isTrial ? "Client deleted" : "Client marked as inactive");
      router.push("/admin/clients");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Failed to delete client");
    }
  };

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      trial: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      overdue: "bg-yellow-100 text-yellow-800",
      suspended: "bg-red-100 text-red-800",
    };
    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{client.business_name}</h1>
            <p className="text-muted-foreground">{client.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {client.role === "client" && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/admin/clients/${client.id}/adjust-pricing`)
                }
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Adjust Pricing
              </Button>
              <Button variant="destructive" onClick={handleDeleteClient}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="end-users">End Users</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  {getStatusBadge(client.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium">{client.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{client.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {client.created_at ? formatDate(client.created_at) : "-"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Users</span>
                  <span className="font-medium">{client.total_users}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Bill</span>
                  <span className="font-medium">
                    {formatCurrency(client.monthly_bill)}
                  </span>
                </div>
                {client.status === "trial" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trial Ends</span>
                    <span className="font-medium">
                      {client.trial_ends_at
                        ? formatDate(client.trial_ends_at)
                        : "-"}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="end-users">
          <Card>
            <CardHeader>
              <CardTitle>End Users ({endUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No end users
                      </TableCell>
                    </TableRow>
                  ) : (
                    endUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{user.package_name}</TableCell>
                        <TableCell>
                          {formatCurrency(user.package_price)}
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell>{formatDate(user.due_date)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices ({invoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Paid At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No invoices
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>
                          {new Date(
                            invoice.period_year,
                            invoice.period_month - 1
                          ).toLocaleDateString("id-ID", {
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(invoice.total_amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>
                          {invoice.paid_at ? formatDate(invoice.paid_at) : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>Reminders ({reminders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>End User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No reminders
                      </TableCell>
                    </TableRow>
                  ) : (
                    reminders.map((reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell>{reminder.end_user?.name || "-"}</TableCell>
                        <TableCell>{reminder.type.replace("_", " ")}</TableCell>
                        <TableCell>{getStatusBadge(reminder.status)}</TableCell>
                        <TableCell>{formatDate(reminder.sent_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
