"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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
  const [phoneError, setPhoneError] = useState(false);
  const [whatsappError, setWhatsappError] = useState(false);
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
      toast.success("Register sukses - Selamat datang!");
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || "Registrasi gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, contact_whatsapp: value });

    // Validasi real-time: cek apakah dimulai dengan 628
    if (value.length > 0 && !value.startsWith("628")) {
      setWhatsappError(true);
    } else {
      setWhatsappError(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, phone: value });

    // Validasi real-time: cek apakah dimulai dengan 628
    if (value.length > 0 && !value.startsWith("628")) {
      setPhoneError(true);
    } else {
      setPhoneError(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Buat Account</CardTitle>
          <CardDescription>Mulai 90 hari trial secara gratis</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Nama bisnis *</Label>
              <Input id="business_name" placeholder="Nama Bisnis anda" value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">Tipe Bisnis *</Label>
              <Input id="business_type" placeholder="Tipe bisnis anda (Kost/subscribe bulanan)" value={formData.business_type} onChange={(e) => setFormData({ ...formData, business_type: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomer telepon Bisnis anda (Tidak akan disebarkan)</Label>
              <Input id="phone" placeholder="628123456789" value={formData.phone} onChange={handlePhoneChange} type="tel" inputMode="numeric" pattern="[0-9]*" className={phoneError ? "border-red-500 focus-visible:ring-red-500" : ""} />
              <p className="text-xs text-muted-foreground">{phoneError ? <span className="text-red-500">Nomor harus dimulai dengan 628</span> : "Untuk reminder anda"}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_whatsapp">Nomer whatsapp bisnis anda (Untuk broadcast ke pelanggan anda)</Label>
              <Input
                id="contact_whatsapp"
                placeholder="628123456789"
                value={formData.contact_whatsapp}
                onChange={handleWhatsAppChange}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                className={whatsappError ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">{whatsappError ? <span className="text-red-500">Nomor harus dimulai dengan 628</span> : "Akan broadcast ke seluruh pelanggan anda. Mulai dari 628."}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full mt-5" disabled={loading}>
              {loading ? "Membuat akun..." : "Akun terbuat"}
            </Button>
            <p className="text-sm text-center text-gray-600">
              Sudah punya akun?{" "}
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
