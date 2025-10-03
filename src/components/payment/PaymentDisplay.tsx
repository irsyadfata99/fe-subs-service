"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Building2, QrCode, Copy, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";

interface PaymentDisplayProps {
  method: "BCA_VA" | "QRIS";
  vaNumber?: string;
  qrUrl?: string;
  paymentUrl?: string;
  expiredTime?: string;
  amount: number;
  onChangeMethod?: () => void;
  showChangeButton?: boolean;
}

export default function PaymentDisplay({
  method,
  vaNumber,
  qrUrl,
  paymentUrl,
  expiredTime,
  amount,
  onChangeMethod,
  showChangeButton = true,
}: PaymentDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  // Countdown untuk redirect button
  useEffect(() => {
    if (!paymentUrl) return;

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
  }, [paymentUrl]);

  // Calculate time left until expired
  useEffect(() => {
    if (!expiredTime) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const expired = new Date(expiredTime).getTime();
      const diff = expired - now;

      if (diff <= 0) {
        setTimeLeft("Kadaluarsa");
        setIsExpired(true);

        // AUTO-REFRESH ON EXPIRE
        if (onChangeMethod && !isExpired) {
          toast.error(
            "Pembayaran telah kadaluarsa. Silakan buat pembayaran baru."
          );
          setTimeout(() => {
            onChangeMethod(); // Trigger method change to regenerate
          }, 2000);
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
      setIsExpired(false);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiredTime, onChangeMethod, isExpired]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Nomor VA berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayNow = () => {
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
    }
  };

  const handleChangeMethod = () => {
    if (!onChangeMethod) return;

    // Add confirmation before changing
    if (
      confirm(
        "Yakin ingin mengganti metode pembayaran? Pembayaran saat ini akan dibatalkan."
      )
    ) {
      onChangeMethod();
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Method Badge */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          {method === "BCA_VA" ? (
            <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : (
            <QrCode className="h-5 w-5 text-green-600 dark:text-green-400" />
          )}
          <span className="font-semibold text-green-900 dark:text-green-100">
            {method === "BCA_VA" ? "BCA Virtual Account" : "QRIS"}
          </span>
        </div>

        {/* BCA VA Number */}
        {method === "BCA_VA" && vaNumber && (
          <div className="space-y-2">
            <p className="text-xs text-green-700 dark:text-green-300">
              Nomor Virtual Account:
            </p>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-md p-3 border border-green-300 dark:border-green-700">
              <p className="text-lg font-mono font-bold text-green-900 dark:text-green-100 flex-1">
                {vaNumber}
              </p>
              <button
                onClick={() => handleCopy(vaNumber)}
                className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-green-600" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* QRIS QR Code */}
        {method === "QRIS" && qrUrl && (
          <div className="space-y-2">
            <p className="text-xs text-green-700 dark:text-green-300 text-center">
              Scan QR Code dengan aplikasi e-wallet Anda:
            </p>
            <div className="bg-white rounded-lg p-4 flex items-center justify-center">
              <img
                src={qrUrl}
                alt="QRIS QR Code"
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-700 dark:text-green-300">
              Total Pembayaran:
            </span>
            <span className="text-xl font-bold text-green-900 dark:text-green-100">
              {formatCurrency(amount)}
            </span>
          </div>
        </div>

        {/* Expired Time */}
        {expiredTime && (
          <div className="mt-2 text-center">
            <p className="text-xs text-green-700 dark:text-green-300">
              Berlaku hingga:{" "}
              <span
                className={`font-semibold ${isExpired ? "text-red-600" : ""}`}
              >
                {timeLeft}
              </span>
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {new Date(expiredTime).toLocaleString("id-ID")}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {paymentUrl && (
          <>
            <Button
              onClick={handlePayNow}
              className="w-full gap-2"
              size="lg"
              disabled={countdown > 0 || isExpired}
            >
              {countdown > 0 ? (
                `Tunggu ${countdown} detik...`
              ) : isExpired ? (
                "Pembayaran Kadaluarsa"
              ) : (
                <>
                  Bayar Sekarang via Tripay
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </Button>
            {!isExpired && (
              <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                Anda akan diarahkan ke halaman pembayaran Tripay
              </p>
            )}
          </>
        )}

        {showChangeButton && onChangeMethod && (
          <Button
            onClick={handleChangeMethod}
            variant="outline"
            className="w-full"
            size="sm"
            disabled={isExpired}
          >
            {isExpired ? "Buat Pembayaran Baru" : "Ganti Metode Pembayaran"}
          </Button>
        )}
      </div>
    </div>
  );
}
