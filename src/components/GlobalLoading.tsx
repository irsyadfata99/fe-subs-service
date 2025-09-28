"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface GlobalLoadingProps {
  isLoading: boolean;
  progress?: number;
  total?: number;
  message?: string;
}

export function GlobalLoading({
  isLoading,
  progress,
  total,
  message,
}: GlobalLoadingProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  const percentage =
    progress && total ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card rounded-lg p-6 shadow-xl max-w-sm w-full mx-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />

          {message && (
            <p className="text-sm font-medium text-center">{message}</p>
          )}

          {progress !== undefined && total !== undefined && (
            <>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress} of {total} processed ({percentage}%)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
