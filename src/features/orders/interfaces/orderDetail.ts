export interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_wholesale?: boolean;
  wholesale_savings?: number;
  product: {
    id: string;
    name: string;
    type: string;
    image_url?: string | null;
  } | null;
}

export interface PaymentMetadata {
  mp_fee_amount?: number;
  pars_fee_amount?: number;
}

export interface OrderPayment {
  provider: string;
  status: string;
  amount: number;
  metadata?: PaymentMetadata | null;
}

export interface OrderPaymentSchedule {
  id: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: string;
  paid_at?: string | null;
}

export interface OrderLoanSummary {
  id: string;
  status: string;
  amount: number;
  amount_pending: number;
  concept: string;
}

export interface OrderDetail {
  id: string;
  status: string;
  cancelled_from?: string | null;
  source?: "dashboard" | "public_store" | "qr_payment" | "qr_table" | null;
  order_type?: "dine_in" | "takeaway" | "qr_payment" | null;
  qr_code_id?: string | null;
  table_label?: string | null;
  diner_count?: number | null;
  customer_id?: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount: number;
  total: number;
  paid_total?: number;
  balance_due?: number;
  payment_mode?: "single" | "subscription" | "partial" | null;
  payment_plan_status?: string | null;
  created_at: string;
  paid_at: string | null;
  assigned_to: string | null;
  assigned_user?: {
    id: string;
    display_name: string | null;
    email: string | null;
  } | null;
  payment_method: string | null;
  payment_link?: string | null;
  mp_preference_id?: string | null;
  items: OrderItem[];
  payments?: OrderPayment[];
  payment_schedules?: OrderPaymentSchedule[];
  loan?: OrderLoanSummary | null;
}

export interface TeamMemberOption {
  user_id: string;
  display_name: string;
  email: string;
}
