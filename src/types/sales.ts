export interface SalesCommission {
  id: string;
  order_id: string;
  user_id: string;
  total_items_sold: number;
  products_count: number;
  services_count: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  commission_amount: number;
  commission_config: CommissionConfig | null;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  profiles?: {
    id: string;
    display_name: string | null;
    email: string | null;
  };
  orders?: {
    id: string;
    created_at: string;
    status: string;
  };
}

export interface CommissionConfig {
  products?: {
    qty: number;
    amount: number;
  };
  services?: {
    qty: number;
    amount: number;
  };
}

export interface CommissionSummary {
  user_id: string;
  display_name: string | null;
  email: string | null;
  total_orders: number;
  total_items: number;
  products_sold: number;
  services_sold: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  total_commission: number;
  paid_commission: number;
  pending_commission: number;
}

export interface CommissionPayment {
  id: string;
  user_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  total_orders: number;
  total_items: number;
  products_sold: number;
  services_sold: number;
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  commission_amount: number;
  payment_status: string;
  paid_at: string | null;
  payment_notes: string | null;
  created_at: string;
  profiles?: {
    id: string;
    display_name: string | null;
    email: string | null;
  };
}
