"use client";

import { useState } from "react";
import { X, CreditCard, QrCode } from "lucide-react";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: "BCA_VA" | "QRIS") => Promise<void>;
  isLoading?: boolean;
}

export default function PaymentMethodModal({ isOpen, onClose, onSelectMethod, isLoading = false }: PaymentMethodModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"BCA_VA" | "QRIS" | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedMethod) return;
    await onSelectMethod(selectedMethod);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pilih Metode Pembayaran</h2>
          <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* BCA Virtual Account */}
          <button
            onClick={() => setSelectedMethod("BCA_VA")}
            disabled={isLoading}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              selectedMethod === "BCA_VA" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedMethod === "BCA_VA" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">BCA Virtual Account</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Transfer melalui ATM, m-banking, atau internet banking BCA</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${selectedMethod === "BCA_VA" ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"}`}>
                {selectedMethod === "BCA_VA" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* QRIS */}
          <button
            onClick={() => setSelectedMethod("QRIS")}
            disabled={isLoading}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              selectedMethod === "QRIS" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedMethod === "QRIS" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                <QrCode className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white">QRIS</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Scan QR code dengan aplikasi e-wallet atau m-banking</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${selectedMethod === "QRIS" ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-gray-600"}`}>
                {selectedMethod === "QRIS" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod || isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Memproses..." : "Lanjutkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
