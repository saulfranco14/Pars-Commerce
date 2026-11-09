import type { StudioRows } from "@/types/studio.database";
export interface StudioPlatformData {
  memberships: Array<
    Pick<
      StudioRows["tenant_studio_subscriptions"],
      | "id"
      | "tenant_id"
      | "plan_code"
      | "status"
      | "current_period_end"
      | "ai_blocked"
    >
  >;
  jobs: Array<
    Pick<
      StudioRows["studio_ai_jobs"],
      "id" | "tenant_id" | "status" | "error_code" | "created_at" | "updated_at"
    >
  >;
  payments: Array<
    Pick<
      StudioRows["studio_payments"],
      | "id"
      | "tenant_id"
      | "status"
      | "amount_mxn"
      | "refunded_mxn"
      | "created_at"
    >
  >;
  events: Array<
    Pick<
      StudioRows["studio_payment_events"],
      "id" | "resource_type" | "status" | "error_code" | "received_at"
    >
  >;
  reservations: Array<
    Pick<
      StudioRows["studio_credit_reservations"],
      "id" | "tenant_id" | "job_id" | "amount" | "expires_at"
    >
  >;
  limits: StudioRows["studio_runtime_limits"];
  attempts: Array<
    Pick<
      StudioRows["studio_ai_attempts"],
      | "provider"
      | "estimated_cost_usd"
      | "actual_cost_usd"
      | "status"
      | "created_at"
    >
  >;
}
