export type BillingPlanCode = "free" | "operation" | "growth" | "scale";
export type BillingStatus =
  | "free"
  | "pending_payment"
  | "active"
  | "past_due"
  | "cancelling"
  | "cancelled";

export interface TenantEntitlements {
  active_table_limit: number;
  active_kiosk_limit: number;
  credit_recommendation: boolean;
  advanced_reporting: boolean;
  export_reports: boolean;
  portfolio_dashboard_limit: number;
  scheduled_report_frequency: "weekly" | "daily_or_weekly" | null;
  credit_policy_editor: boolean;
}

export interface BillingPlan {
  code: BillingPlanCode;
  name: string;
  amount_mxn: number;
  billing_interval: "month";
  entitlements: TenantEntitlements;
  is_active: boolean;
}

export interface BillingAccount {
  tenant_id: string;
  plan_code: BillingPlanCode;
  status: BillingStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  mp_init_point: string | null;
  plan: BillingPlan;
  usage: { active_tables: number; active_kiosks: number };
}

export const PLAN_ORDER: BillingPlanCode[] = [
  "free",
  "operation",
  "growth",
  "scale",
];

export const DEFAULT_FREE_ENTITLEMENTS: TenantEntitlements = {
  active_table_limit: 5,
  active_kiosk_limit: 0,
  credit_recommendation: false,
  advanced_reporting: false,
  export_reports: false,
  portfolio_dashboard_limit: 0,
  scheduled_report_frequency: null,
  credit_policy_editor: false,
};

export function hasBillingCapability(
  entitlements: TenantEntitlements,
  capability: keyof Omit<TenantEntitlements, "active_table_limit" | "active_kiosk_limit" | "portfolio_dashboard_limit" | "scheduled_report_frequency">,
) {
  return Boolean(entitlements[capability]);
}
