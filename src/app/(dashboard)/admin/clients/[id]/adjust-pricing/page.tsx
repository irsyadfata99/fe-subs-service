"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function AdjustPricingPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    new_price: "",
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.new_price || parseFloat(formData.new_price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/admin/clients/${params.id}/adjust-pricing`, {
        new_price: parseFloat(formData.new_price),
        reason: formData.reason,
      });

      toast.success("Pricing adjusted successfully");
      router.push(`/admin/clients/${params.id}`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error("Failed to adjust pricing", {
        description: err.response?.data?.error || "Please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Adjust Client Pricing</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_price">New Price per User (IDR) *</Label>
              <Input id="new_price" type="number" step="100" min="0" required value={formData.new_price} onChange={(e) => setFormData({ ...formData, new_price: e.target.value })} placeholder="3000" />
              <p className="text-sm text-muted-foreground">Current default: Rp 3,000 per user</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Price increase, Special discount, Promotion"
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Pricing"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
