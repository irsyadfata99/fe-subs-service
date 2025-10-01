"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { getErrorMessage } from "@/types/api";

export default function NewEndUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    package_name: "",
    package_price: "",
    billing_cycle: "30", // Changed from "monthly" to number (days)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate due_date on frontend (current date + billing_cycle days)
      const today = new Date();
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + parseInt(formData.billing_cycle));

      const payload = {
        name: formData.name,
        phone: formData.phone,
        package_name: formData.package_name,
        package_price: parseFloat(formData.package_price),
        billing_cycle: parseInt(formData.billing_cycle), // Send as number
        // due_date will be calculated by backend
      };

      await api.post("/end-users", payload);

      alert("User created successfully!");
      router.push("/end-users");
    } catch (err: unknown) {
      console.error("Failed to create user:", err);
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/end-users")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Add New User</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                required
                placeholder="628123456789"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Format: 628xxxxxxxxx
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package_name">Package Name *</Label>
              <Input
                id="package_name"
                required
                value={formData.package_name}
                onChange={(e) =>
                  setFormData({ ...formData, package_name: e.target.value })
                }
                placeholder="Premium Membership"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="package_price">Package Price (IDR) *</Label>
              <Input
                id="package_price"
                type="number"
                required
                value={formData.package_price}
                onChange={(e) =>
                  setFormData({ ...formData, package_price: e.target.value })
                }
                placeholder="500000"
                min="0"
                step="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_cycle">Billing Cycle (Days) *</Label>
              <Input
                id="billing_cycle"
                type="number"
                required
                value={formData.billing_cycle}
                onChange={(e) =>
                  setFormData({ ...formData, billing_cycle: e.target.value })
                }
                placeholder="30"
                min="1"
                max="365"
              />
              <p className="text-xs text-muted-foreground">
                Number of days until next payment (e.g., 30 for monthly)
              </p>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Preview:</strong> Due date will be{" "}
                {formData.billing_cycle
                  ? `${formData.billing_cycle} days`
                  : "..."}{" "}
                from today
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create User"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/end-users")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
