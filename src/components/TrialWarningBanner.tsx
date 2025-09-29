"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CreditCard } from "lucide-react";

interface TrialWarningBannerProps {
  daysRemaining: number;
  monthlyBill: number;
  onUpgrade: () => void;
}

export function TrialWarningBanner({ daysRemaining, monthlyBill, onUpgrade }: TrialWarningBannerProps) {
  // Only show if <= 7 days remaining
  if (daysRemaining > 7) return null;

  const getSeverity = () => {
    if (daysRemaining <= 1) return "error";
    if (daysRemaining <= 3) return "warning";
    return "info";
  };

  const getIcon = () => {
    if (daysRemaining <= 1) return <AlertCircle className="h-5 w-5" />;
    return <Clock className="h-5 w-5" />;
  };

  const getMessage = () => {
    if (daysRemaining === 0) {
      return "Trial ends today!";
    } else if (daysRemaining === 1) {
      return "Trial ends tomorrow!";
    } else {
      return `Trial ends in ${daysRemaining} days`;
    }
  };

  const severity = getSeverity();
  const bgColor =
    severity === "error"
      ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
      : severity === "warning"
      ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
      : "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800";

  const textColor = severity === "error" ? "text-red-900 dark:text-red-100" : severity === "warning" ? "text-yellow-900 dark:text-yellow-100" : "text-blue-900 dark:text-blue-100";

  // FIX: Safe number conversion
  const safeBill = typeof monthlyBill === "number" ? monthlyBill : 0;
  const totalUsers = Math.ceil(safeBill / 3000);

  return (
    <Alert className={`${bgColor} ${textColor} mb-6`}>
      {getIcon()}
      <AlertTitle className="font-semibold text-lg">{getMessage()}</AlertTitle>
      <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="font-medium">Upgrade now to continue service without interruption.</p>
          <p className="text-sm mt-1 opacity-90">
            Monthly fee: Rp {safeBill.toLocaleString("id-ID")} for {totalUsers} active {totalUsers === 1 ? "user" : "users"}
          </p>
        </div>
        <Button onClick={onUpgrade} variant={severity === "error" ? "destructive" : "default"} className="shrink-0 gap-2">
          <CreditCard className="h-4 w-4" />
          Upgrade Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
