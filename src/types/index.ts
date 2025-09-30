export interface Client {
  id: number;
  business_name: string;
  business_type: string;
  email: string;
  phone?: string;
  contact_whatsapp?: string; // ← NEW
  logo_url?: string;
  status: "trial" | "active" | "suspended";
  role: "client" | "admin" | "super_admin"; // ← ADD THIS
  trial_ends_at: string;
  total_users: number;
  monthly_bill: number;
  last_active_at: string; // ← ADD THIS
  created_at: string;
}

export interface EndUser {
  id: number;
  client_id: number;
  name: string;
  phone: string;
  package_name: string;
  package_price: number;
  billing_cycle: string;
  due_date: string;
  status: "active" | "overdue" | "inactive";
  last_reminder_sent?: string;
  created_at: string;
}

export interface Reminder {
  id: number;
  client_id: number;
  end_user_id: number;
  phone: string;
  message: string;
  type: "before_3days" | "before_1day" | "overdue";
  status: "sent" | "failed";
  response?: Record<string, unknown>; // Changed from any
  sent_at: string;
  end_user?: {
    name: string;
    phone: string;
  };
}

export interface Invoice {
  id: number;
  client_id: number;
  invoice_number: string;
  period_month: number;
  period_year: number;
  total_users: number;
  price_per_user: number;
  total_amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "expired" | "cancelled";
  payment_method_selected?: "BCA_VA" | "QRIS"; // ← ADD THIS
  checkout_url?: string;
  qr_url?: string; // ← ADD THIS
  qr_string?: string; // ← ADD THIS
  paid_at?: string;
  expired_at?: string; // ← ADD THIS
  created_at: string;
}

// NEW TYPES
export interface AdminStats {
  clients: {
    total: number;
    trial: number;
    active: number;
    overdue: number;
    suspended: number;
  };
  end_users: {
    total: number;
  };
  revenue: {
    this_month: number;
  };
  reminders: {
    today: {
      sent: number;
      failed: number;
    };
  };
  system: {
    database: {
      status: string;
      message: string;
    };
    memory: {
      rss: string;
      heapUsed: string;
      heapTotal: string;
    };
  };
}

export interface PricingAdjustment {
  id: number;
  client_id: number;
  old_price: number;
  new_price: number;
  reason: string;
  adjusted_by: number;
  adjusted_at: string;
}

export interface DashboardStats {
  client: {
    business_name: string;
    status: string;
    trial_days_remaining: number;
  };
  users: {
    total: number;
    active: number;
    overdue: number;
    inactive: number;
  };
  reminders: {
    total: number;
    sent: number;
    failed: number;
  };
  billing: {
    monthly_bill: number;
    pending_invoice: Invoice | null;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Fixed: Simplified structure
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Or if backend returns different structure:
export interface BackendPaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
