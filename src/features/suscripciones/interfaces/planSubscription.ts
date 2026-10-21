import type { IntervalUnit } from "@/lib/offers/planPeriods";

export type PlanSubscriptionStatus = "pending_setup" | "active" | "past_due" | "paused" | "completed" | "cancelled";
export type PlanPeriodStatus = "pending" | "paid" | "overdue" | "waived" | "cancelled";
export type PlanSubscriptionTab = "por_cobrar" | "activas" | "vencidas" | "pendientes" | "terminadas";

export interface PlanSnapshot {
  name: string;
  kind: "subscription" | "membership";
  price: number;
  interval_unit: IntervalUnit;
  interval_count: number;
  max_periods: number | null;
  renewal_lead_days: number;
  grace_days: number;
  preferred_weekday: number | null;
  items: Array<{ product_id: string; product_variant_id: string | null; quantity: number; name: string }>;
}

export interface PlanPeriod {
  id: string;
  period_number: number;
  status: PlanPeriodStatus;
  amount: number;
  starts_at: string;
  ends_at: string;
  due_at: string;
  paid_at: string | null;
  order_id: string | null;
  /** `/pedido/{token}` of the period's order, where the customer pays it. */
  order_tracking_token: string | null;
}

export interface PlanSubscriptionRow {
  id: string;
  status: PlanSubscriptionStatus;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  plan: PlanSnapshot;
  fulfillment_method: "pickup" | "delivery" | null;
  current_period_number: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  past_due_since: string | null;
  public_token: string;
  created_at: string;
  /** The period waiting for payment (pending or overdue), if any. */
  due_period: PlanPeriod | null;
}

export interface PlanSubscriptionDetail extends PlanSubscriptionRow {
  periods: PlanPeriod[];
}

/** What the customer sees at /plan/{token}. */
export interface PublicPlanView extends PlanSubscriptionDetail {
  tenant: { name: string; logo_url: string | null; whatsapp_phone: string | null; site_slug: string | null };
}

export interface PlanRenewalControlProps {
  token: string;
  cancelAtPeriodEnd: boolean;
  periodEndLabel: string | null;
}
