"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw, Clock, Download } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface QRISModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrUrl: string;
  amount: number;
  expiredTime: string;
  reference: string;
  invoiceNumber: string;
}

export default function QRISModal({ isOpen, onClose, qrUrl, amount, expiredTime, reference, invoiceNumber }: QRISModalProps) {
  const [currentQrUrl, setCurrentQrUrl] = useState(qrUrl);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    setCurrentQrUrl(qrUrl);
  }, [qrUrl]);

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

  const handleRefreshQR = async () => {
    setRefreshing(true);
    try {
      const invoiceId = reference.split("-")[0]; // Extract invoice ID from reference
      const { data } = await api.post(`/billing/invoices/${invoiceId}/refresh-qr`);
      setCurrentQrUrl(data.qr_url);
      toast.success("QR code refreshed!");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to refresh QR code");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement("a");
    link.href = currentQrUrl;
    link.download = `QRIS-${invoiceNumber}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded!");
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">QRIS Payment</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Timer */}
          {timeLeft && timeLeft !== "Expired" && (
            <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-300">QR code expires in</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{timeLeft}</p>
              </div>
            </div>
          )}

          {timeLeft === "Expired" && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-900 dark:text-red-300">QR code has expired. Please refresh or generate a new payment.</p>
            </div>
          )}

          {/* QR Code */}
          <div className="flex flex-col items-center">
            <div className="p-4 bg-white rounded-lg border-2 border-gray-200 dark:border-gray-700">
              {currentQrUrl ? (
                <img src={currentQrUrl} alt="QRIS QR Code" className="w-64 h-64 object-contain" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">Loading QR...</p>
                </div>
              )}
            </div>

            {/* QR Actions */}
            <div className="flex gap-2 mt-4">
              <button onClick={handleRefreshQR} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh QR"}
              </button>
              <button onClick={handleDownloadQR} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount to Pay</label>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(amount)}</p>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Instructions</h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex gap-2">
                <span className="font-semibold">1.</span>
                <span>Open your e-wallet or banking app</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">2.</span>
                <span>Select &quot;Scan QRIS&quot; or &quot;Scan QR&quot;</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">3.</span>
                <span>Scan the QR code above</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">4.</span>
                <span>Verify the amount matches</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold">5.</span>
                <span>Complete the payment</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
