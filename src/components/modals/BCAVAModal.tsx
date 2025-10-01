"use client";

import { useState, useEffect } from "react";
import { X, Copy, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface BCAVAModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaNumber: string;
  amount: number;
  expiredTime: string;
  paymentUrl: string;
  invoiceNumber: string;
}

export default function BCAVAModal({ isOpen, onClose, vaNumber, amount, expiredTime, paymentUrl, invoiceNumber }: BCAVAModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiredTime) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiredTime).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiredTime]);

  const handleCopy = () => {
    navigator.clipboard.writeText(vaNumber);
    setCopied(true);
    toast.success("VA Number copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">BCA Virtual Account</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {timeLeft && timeLeft !== "Expired" && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Payment expires in</p>
                <p className="text-lg font-bold text-blue-600">{timeLeft}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Virtual Account Number</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-gray-50 border rounded-lg">
                <p className="text-2xl font-mono font-bold">{vaNumber}</p>
              </div>
              <button onClick={handleCopy} className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Pay</label>
            <div className="p-4 bg-gray-50 border rounded-lg">
              <p className="text-3xl font-bold">{formatCurrency(amount)}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button onClick={onClose} className="w-full px-4 py-2 bg-gray-200 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
