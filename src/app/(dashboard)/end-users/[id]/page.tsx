"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Send } from "lucide-react";
import { EndUser } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EndUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<EndUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/end-users/${params.id}`);
      setUser(response.data.data);
    } catch (error) {
      toast.error("Failed to load user");
      router.push("/end-users");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async () => {
    try {
      await api.post("/reminders/send-manual", {
        end_user_id: user?.id,
        type: "before_3days",
      });
      toast.success("Reminder sent successfully");
    } catch (error) {
      toast.error("Failed to send reminder");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-gray-500">End User Details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/end-users/${user.id}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button onClick={handleSendReminder}>
            <Send className="w-4 h-4 mr-2" />
            Send Reminder
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{user.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge
                className={
                  user.status === "active"
                    ? "bg-green-100 text-green-800"
                    : user.status === "overdue"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {user.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Package</p>
              <p className="font-medium">{user.package_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Package Price</p>
              <p className="font-medium">
                Rp {user.package_price.toLocaleString("id-ID")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-medium">
                {format(new Date(user.due_date), "dd MMM yyyy")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Reminder</p>
              <p className="font-medium">
                {user.last_reminder_sent
                  ? format(
                      new Date(user.last_reminder_sent),
                      "dd MMM yyyy HH:mm"
                    )
                  : "Never"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
