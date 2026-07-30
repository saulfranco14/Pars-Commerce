import type { OrderSource } from "@/lib/formatSource";

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

export interface OrderPaymentPending {
  id: string;
  amount: number;
  /** `efectivo` | `transferencia` | `tarjeta`, tal como lo dijo el cliente. */
  method: string | null;
  created_at: string | null;
}

export interface PaymentMetadata {
  mp_fee_amount?: number;
  /** Comisión de plataforma. */
  tlaco_fee_amount?: number;
  /**
   * Nombre anterior de la marca. Los pagos guardados antes del rebrand siguen
   * teniendo esta clave, así que la lectura acepta ambas. No escribir aquí.
   * @deprecated usar `tlaco_fee_amount`
   */
  pars_fee_amount?: number;
  /** Cómo dijo el cliente que iba a pagar: efectivo, transferencia, tarjeta. */
  method?: string;
}

export interface OrderPayment {
  id?: string;
  provider: string;
  status: string;
  amount: number;
  created_at?: string | null;
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
  /** Los 8 del id en mayúsculas. Es el número que el cliente canta al pagar. */
  order_number?: string | null;
  status: string;
  /**
   * Avance del trabajo: `received | in_progress | ready`. Es un eje APARTE de
   * `status`, que es el ciclo de cobro — un pedido puede estar pagado y todavía
   * sin hacer (el cliente pagó por adelantado).
   */
  fulfillment_status?: string | null;
  cancelled_from?: string | null;
  source?: OrderSource | null;
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
  /** Cuándo pasa el cliente por él. `null` = sin agendar. */
  scheduled_for?: string | null;
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
  /** Pedido ya pagado que este complementa. Solo en pedidos complementarios. */
  parent_order_id?: string | null;
  /** Pedidos complementarios colgados de este. Solo un nivel de profundidad. */
  addenda?: OrderAddendumSummary[];
}

/** Lo mínimo para listar un pedido complementario sin volver a pedirlo. */
export interface OrderAddendumSummary {
  id: string;
  status: string;
  total: number;
  created_at: string;
}

export interface TeamMemberOption {
  user_id: string;
  display_name: string;
  email: string;
}
