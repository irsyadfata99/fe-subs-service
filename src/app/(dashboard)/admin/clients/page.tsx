"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Client } from "@/types";
import { Search, Eye, Trash2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function AdminClientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (roleFilter !== "all") params.role = roleFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get("/admin/clients", { params });
      setClients(response.data.data.clients);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, roleFilter, searchQuery]);

  useEffect(() => {
    if (user && user.role !== "super_admin") {
      router.push("/dashboard");
      return;
    }

    fetchClients();
  }, [user, router, fetchClients]);

  const handleDeleteClient = async (clientId: number, businessName: string, status: string) => {
    const isTrial = status === "trial";
    const confirmMessage = isTrial ? `Permanently delete client "${businessName}"? This action cannot be undone.` : `Mark client "${businessName}" as inactive?`;

    if (!confirm(confirmMessage)) return;

    try {
      await api.delete(`/admin/clients/${clientId}`);
      toast.success(`Client ${isTrial ? "deleted" : "marked as inactive"} successfully`);
      fetchClients();
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      const errorMessage = err.response?.data?.error || "Failed to delete client";
      toast.error(errorMessage);
      console.error("Failed to delete client:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      trial: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      overdue: "bg-yellow-100 text-yellow-800",
      suspended: "bg-red-100 text-red-800",
    };

    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      client: "bg-gray-100 text-gray-800",
      admin: "bg-purple-100 text-purple-800",
      super_admin: "bg-orange-100 text-orange-800",
    };

    return <Badge className={variants[role] || ""}>{role}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Client Management</h1>
        <p className="text-muted-foreground mt-1">View and manage all clients</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Monthly Bill</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.business_name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>{getRoleBadge(client.role)}</TableCell>
                      <TableCell>{client.total_users}</TableCell>
                      <TableCell>Rp {client.monthly_bill.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{client.created_at ? format(new Date(client.created_at), "dd MMM yyyy") : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/clients/${client.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {client.role === "client" && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/clients/${client.id}/adjust-pricing`)} title="Adjust Pricing">
                                <DollarSign className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client.id, client.business_name, client.status)} title="Delete Client">
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
