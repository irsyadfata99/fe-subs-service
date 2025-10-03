import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// STATUS CHECK UTILITIES
// ============================================

/**
 * Check if account is restricted (suspended or overdue)
 * Used to determine if user should see payment modal
 */
export function isAccountRestricted(status: string): boolean {
  return status === "suspended" || status === "overdue";
}

/**
 * Check if account needs payment
 * Used to show payment banners/alerts
 */
export function needsPayment(status: string): boolean {
  return ["trial", "overdue", "suspended"].includes(status);
}

/**
 * Check if account can access features
 * Used to gate feature access
 */
export function canAccessFeatures(status: string): boolean {
  return ["trial", "active"].includes(status);
}

/**
 * Check if account is in grace period
 * Grace period: 3 days after due date before suspension
 */
export function isInGracePeriod(dueDate: string): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diffDays > 0 && diffDays <= 3;
}

/**
 * Get remaining grace period days
 * Returns 0-3 days
 */
export function getGraceDaysLeft(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, 3 - diffDays);
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format currency to IDR
 * Consistent formatting across all components
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian locale
 * Example: "15 Januari 2025"
 */
export function formatDate(date: string | Date): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format date with time
 * Example: "15 Januari 2025, 14:30"
 */
export function formatDateTime(date: string | Date): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Format WhatsApp number for display
 * Example: "628123456789" → "+62 812-3456-789"
 */
export function formatWhatsApp(phone: string | null): string {
  if (!phone) return "-";

  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("62")) {
    const countryCode = cleaned.slice(0, 2);
    const operator = cleaned.slice(2, 5);
    const part1 = cleaned.slice(5, 9);
    const part2 = cleaned.slice(9);
    return `+${countryCode} ${operator}-${part1}-${part2}`;
  }

  return phone;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate WhatsApp number format
 * Must start with 628 and be 11-13 digits
 */
export function validateWhatsApp(phone: string): {
  valid: boolean;
  error?: string;
} {
  if (!phone) {
    return { valid: true }; // Optional field
  }

  const cleaned = phone.replace(/\D/g, "");

  if (!cleaned.startsWith("628")) {
    return { valid: false, error: "Nomor WhatsApp harus dimulai dengan 628" };
  }

  if (cleaned.length < 11 || cleaned.length > 13) {
    return {
      valid: false,
      error: "Nomor WhatsApp harus 11-13 digit (628 + 8-10 digit)",
    };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
