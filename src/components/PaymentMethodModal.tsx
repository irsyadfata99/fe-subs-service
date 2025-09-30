"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, QrCode } from "lucide-react";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (method: "BCA_VA" | "QRIS") => void;
  amount: number;
  invoiceNumber: string;
}

export function PaymentMethodModal({ isOpen, onClose, onSelect, amount, invoiceNumber }: PaymentMethodModalProps) {
  const [selecting, setSelecting] = useState(false);

  const handleSelect = async (method: "BCA_VA" | "QRIS") => {
    setSelecting(true);
    try {
      await onSelect(method);
    } finally {
      setSelecting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>Select how you want to pay for invoice {invoiceNumber}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* BCA VA */}
            <button onClick={() => handleSelect("BCA_VA")} disabled={selecting} className="flex flex-col items-center gap-3 p-6 border-2 rounded-lg hover:border-primary hover:bg-accent transition-all disabled:opacity-50">
              <CreditCard className="h-8 w-8 text-primary" />
              <div className="text-center">
                <p className="font-semibold">BCA Virtual Account</p>
                <p className="text-xs text-muted-foreground mt-1">Easy & Fast</p>
              </div>
            </button>

            {/* QRIS */}
            <button onClick={() => handleSelect("QRIS")} disabled={selecting} className="flex flex-col items-center gap-3 p-6 border-2 rounded-lg hover:border-primary hover:bg-accent transition-all disabled:opacity-50">
              <QrCode className="h-8 w-8 text-primary" />
              <div className="text-center">
                <p className="font-semibold">QRIS</p>
                <p className="text-xs text-muted-foreground mt-1">Scan to Pay</p>
              </div>
            </button>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">Rp {amount.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-mono text-xs">{invoiceNumber}</span>
            </div>
          </div>

          <Button variant="outline" onClick={onClose} className="w-full" disabled={selecting}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
