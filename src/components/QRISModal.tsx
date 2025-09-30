"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle, QrCode } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface QRISModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  qrUrl: string;
  expiredAt: string;
}

export function QRISModal({ isOpen, onClose, invoiceId, invoiceNumber, amount, qrUrl: initialQrUrl, expiredAt: initialExpiredAt }: QRISModalProps) {
  const [qrUrl, setQrUrl] = useState(initialQrUrl);
  const [expiredAt, setExpiredAt] = useState(new Date(initialExpiredAt).getTime());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const left = Math.floor((expiredAt - now) / 1000);

      if (left <= 0) {
        setSecondsLeft(0);
        setExpired(true);
        clearInterval(interval);
      } else {
        setSecondsLeft(left);
        setExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiredAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRefreshQR = async () => {
    setRefreshing(true);
    try {
      const response = await api.post(`/billing/invoices/${invoiceId}/refresh-qr`);

      setQrUrl(response.data.data.qr_url);
      setExpiredAt(response.data.data.expired_time * 1000);
      setExpired(false);

      toast.success("QR code refreshed");
    } catch (error: unknown) {
      toast.error("Failed to refresh QR code");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan QR Code to Pay
          </DialogTitle>
          <DialogDescription>Use any e-wallet app to scan and complete payment</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* QR Code */}
          <div className="flex justify-center">
            <div className="relative">
              <Image src={qrUrl} alt="QR Code" width={256} height={256} className={`w-64 h-64 border rounded-lg ${expired ? "opacity-50" : ""}`} unoptimized />
              {expired && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <p className="text-white font-semibold">QR Expired</p>
                </div>
              )}
            </div>
          </div>

          {/* Timer */}
          <div className="text-center">
            {expired ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>QR code has expired. Please refresh to generate a new one.</AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Expires in:</span>
                <span className="text-2xl font-bold font-mono">{formatTime(secondsLeft)}</span>
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="border rounded-lg p-4 space-y-2 bg-muted/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">Rp {amount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono text-xs">{invoiceNumber}</span>
            </div>
          </div>

          {/* Supported Apps */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Supported: GoPay, OVO, Dana, ShopeePay, LinkAja</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleRefreshQR} disabled={refreshing || !expired} className="flex-1 gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
