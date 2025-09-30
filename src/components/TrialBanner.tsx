"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TrialBannerProps {
  trialEndsAt: string;
  monthlyBill: number;
  onPayNow: () => void;
}

export function TrialBanner({
  trialEndsAt,
  monthlyBill,
  onPayNow,
}: TrialBannerProps) {
  return (
    <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertTitle className="font-semibold text-blue-900 dark:text-blue-100">
        Trial Period
      </AlertTitle>
      <AlertDescription className="mt-2 text-blue-800 dark:text-blue-200">
        <p className="mb-3">
          Trial akan berakhir pada{" "}
          <strong>{format(new Date(trialEndsAt), "dd MMMM yyyy")}</strong>.
          Mohon segera lakukan pembayaran sebelum seluruh fungsi tersuspend.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm">
            <span>Tagihan Anda: </span>
            <strong className="text-lg">
              Rp {monthlyBill.toLocaleString("id-ID")}
            </strong>
          </div>
          <Button onClick={onPayNow} className="bg-blue-600 hover:bg-blue-700">
            Bayar Sekarang
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
