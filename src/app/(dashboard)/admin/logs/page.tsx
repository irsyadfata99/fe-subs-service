"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";

interface ErrorLog {
  id: number;
  level: string;
  service: string;
  message: string;
  created_at: string;
}

interface CronLog {
  id: number;
  job_name: string;
  status: string;
  duration_ms: number;
  started_at: string;
}

export default function AdminLogsPage() {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [cronLogs, setCronLogs] = useState<CronLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [errorsRes, cronsRes] = await Promise.all([api.get("/admin/logs", { params: { type: "error", limit: 50 } }), api.get("/admin/logs", { params: { type: "cron", limit: 50 } })]);
      setErrorLogs(errorsRes.data.data);
      setCronLogs(cronsRes.data.data);
    } catch (error) {
      console.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getLevelBadge = (level: string) => {
    const variants: Record<string, string> = {
      error: "bg-red-100 text-red-800",
      warning: "bg-yellow-100 text-yellow-800",
      info: "bg-blue-100 text-blue-800",
    };
    return <Badge className={variants[level] || ""}>{level}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground mt-1">Error logs and cron job execution history</p>
        </div>
        <Button onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Error Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No error logs
                  </TableCell>
                </TableRow>
              ) : (
                errorLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.created_at), "dd MMM HH:mm:ss")}</TableCell>
                    <TableCell>{getLevelBadge(log.level)}</TableCell>
                    <TableCell>{log.service}</TableCell>
                    <TableCell className="max-w-md truncate">{log.message}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cron Job Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Started At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No cron logs
                  </TableCell>
                </TableRow>
              ) : (
                cronLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.job_name}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>{log.duration_ms}ms</TableCell>
                    <TableCell>{format(new Date(log.started_at), "dd MMM HH:mm:ss")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
