"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import { validateWhatsApp } from "@/lib/utils";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    business_name: "",
    business_type: "",
    email: "",
    password: "",
    phone: "",
    contact_whatsapp: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate WhatsApp if provided
    if (formData.contact_whatsapp) {
      const validation = validateWhatsApp(formData.contact_whatsapp);
      if (!validation.valid) {
        toast.error(validation.error);
        return;
      }
    }

    // Validate Phone if provided
    if (formData.phone) {
      const validation = validateWhatsApp(formData.phone);
      if (!validation.valid) {
        toast.error("Nomor telepon: " + validation.error);
        return;
      }
    }

    setLoading(true);

    try {
      await register(formData);
      toast.success("Registration successful - Welcome!");
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, contact_whatsapp: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, phone: value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Start your 90-day free trial</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                placeholder="Gym Sehat"
                value={formData.business_name}
                onChange={(e) =>
                  setFormData({ ...formData, business_name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">Business Type *</Label>
              <Input
                id="business_type"
                placeholder="Fitness Center"
                value={formData.business_type}
                onChange={(e) =>
                  setFormData({ ...formData, business_type: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                placeholder="628123456789"
                value={formData.phone}
                onChange={handlePhoneChange}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <p className="text-xs text-muted-foreground">
                For platform notifications
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_whatsapp">
                WhatsApp Business (Optional)
              </Label>
              <Input
                id="contact_whatsapp"
                placeholder="628123456789"
                value={formData.contact_whatsapp}
                onChange={handleWhatsAppChange}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <p className="text-xs text-muted-foreground">
                Will be displayed in end-user reminders. Start with 628.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={8}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
