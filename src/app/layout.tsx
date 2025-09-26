import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner"; // ✅ Gunakan Sonner

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Payment Reminder Platform",
  description: "Automated payment reminder system for subscription businesses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster /> {/* ✅ Sonner Toaster */}
        </AuthProvider>
      </body>
    </html>
  );
}
