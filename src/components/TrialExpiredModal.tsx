"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, AlertCircle, CreditCard, Building2 } from "lucide-react";

interface TrialExpiredModalProps {
  isOpen: boolean;
  invoiceUrl?: string;
  amount?: number; // ← Make optional
  dueDate?: string;
}

export function TrialExpiredModal({ isOpen, invoiceUrl, amount, dueDate }: TrialExpiredModalProps) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isOpen || !invoiceUrl) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, invoiceUrl]);

  // Safe amount with fallback
  const safeAmount = typeof amount === "number" ? amount : 0;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false} onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-xl">Trial Period Ended</DialogTitle>
              <DialogDescription>Your account has been suspended</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>All features are disabled until payment is completed.</AlertDescription>
          </Alert>

          <div className="bg-muted rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount Due</span>
              <span className="text-2xl font-bold">Rp {safeAmount.toLocaleString("id-ID")}</span>
            </div>

            {dueDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span className="font-medium">
                  {new Date(dueDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm pt-2 border-t">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Payment Method:</span>
              <span className="font-medium">BCA Virtual Account</span>
            </div>
          </div>

          {invoiceUrl ? (
            <div className="space-y-3">
              <Button onClick={() => window.open(invoiceUrl, "_blank")} className="w-full gap-2" size="lg" disabled={countdown > 0}>
                <CreditCard className="h-5 w-5" />
                {countdown > 0 ? `Please wait ${countdown}s...` : "Pay Now via Tripay"}
                <ExternalLink className="h-4 w-4" />
              </Button>

              <p className="text-xs text-center text-muted-foreground">You will be redirected to Tripay payment gateway</p>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Payment invoice is being generated. Please refresh the page in a moment.</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="text-xs text-center text-muted-foreground pt-2 border-t">Need help? Contact support at support@yourplatform.com</div>
      </DialogContent>
    </Dialog>
  );
}
