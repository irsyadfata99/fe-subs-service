"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Reminder } from "@/types";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.type = typeFilter;

      const response = await api.get("/reminders", { params });
      setReminders(response.data.data.reminders || response.data.data);
      setTotalPages(response.data.data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
      toast.error("Gagal memuat data pengingat");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const getStatusBadge = (status: string) => {
    return status === "sent" ? <Badge className="bg-green-100 text-green-800">Sent</Badge> : <Badge className="bg-red-100 text-red-800">Failed</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, { text: string; class: string }> = {
      before_3days: { text: "H-3", class: "bg-blue-100 text-blue-800" },
      before_1day: { text: "H-1", class: "bg-yellow-100 text-yellow-800" },
      overdue: { text: "Overdue", class: "bg-red-100 text-red-800" },
    };
    const info = labels[type] || { text: type, class: "" };
    return <Badge className={info.class}>{info.text}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pengingat</h1>
        <p className="text-gray-500 mt-1">List seluruh notifikasi reminder yang telah dikirim</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Seluruh status</SelectItem>
                <SelectItem value="sent">Terkirim</SelectItem>
                <SelectItem value="failed">Gagal</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Seluruh tipe</SelectItem>
                <SelectItem value="before_3days">H-3</SelectItem>
                <SelectItem value="before_1day">H-1</SelectItem>
                <SelectItem value="overdue">Lewat deadline</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchReminders} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna Akhir</TableHead>
                <TableHead>Whatsapp</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terkirim Saat</TableHead>
                <TableHead>Tampilan Pesan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : reminders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Tidak ada reminder ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">{reminder.end_user?.name || "-"}</TableCell>
                    <TableCell>{reminder.phone}</TableCell>
                    <TableCell>{getTypeBadge(reminder.type)}</TableCell>
                    <TableCell>{getStatusBadge(reminder.status)}</TableCell>
                    <TableCell>{reminder.sent_at ? format(new Date(reminder.sent_at), "dd MMM yyyy HH:mm") : "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{reminder.message.substring(0, 50)}...</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                Sebelum
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Selanjutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
