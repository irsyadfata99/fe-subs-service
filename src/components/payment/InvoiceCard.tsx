"use client";

import { FileText, Calendar, DollarSign } from "lucide-react";

interface InvoiceCardProps {
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
  compact?: boolean;
}

export default function InvoiceCard({ invoiceNumber, totalAmount, dueDate, compact = false }: InvoiceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (compact) {
    return (
      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Invoice:</span>
          <span className="font-mono font-semibold text-sm">{invoiceNumber}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Total:</span>
          <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Jatuh Tempo:</span>
          <span className="font-medium">{formatDate(dueDate)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between pb-3 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Nomor Invoice</p>
          <p className="font-mono font-semibold text-sm">{invoiceNumber}</p>
        </div>
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Total Tagihan</span>
        </div>
        <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Jatuh Tempo</span>
        </div>
        <span className="font-medium text-sm">{formatDate(dueDate)}</span>
      </div>
    </div>
  );
}
