import type { IntervalUnit } from "@/lib/offers/planPeriods";

export type OfferPlanKind = "subscription" | "membership";
export type OfferPlanStatus = "draft" | "active" | "paused" | "archived";
export type PlanBillingMethod = "manual" | "mp_auto";
export type PlanFulfillmentMethod = "pickup" | "delivery" | "in_store";

export interface OfferPlanItemInput {
  product_id?: string;
  product_variant_id?: string | null;
  quantity?: number;
}

/** Body accepted by POST/PATCH /api/offer-plans (fields are optional on PATCH). */
export interface OfferPlanWriteInput {
  kind?: string;
  status?: string;
  template_key?: string | null;
  name?: string;
  slug?: string | null;
  description?: string | null;
  image_url?: string | null;
  price?: number;
  interval_unit?: string;
  interval_count?: number;
  max_periods?: number | null;
  billing_methods?: string[];
  fulfillment_methods?: string[];
  preferred_weekday?: number | null;
  renewal_lead_days?: number;
  grace_days?: number;
  max_active_members?: number | null;
  items?: OfferPlanItemInput[] | null;
}

export interface NormalizedOfferPlan {
  fields: Record<string, unknown>;
  /** null = leave items untouched; array = replace them. */
  items: Array<{ product_id: string; product_variant_id: string | null; quantity: number }> | null;
}

export interface OfferPlanItem {
  product_id: string;
  product_variant_id: string | null;
  quantity: number;
  position?: number;
}

/** A plan as the dashboard lists and edits it. */
export interface OfferPlan {
  id: string;
  tenant_id: string;
  kind: OfferPlanKind;
  status: OfferPlanStatus;
  template_key: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price: number;
  interval_unit: IntervalUnit;
  interval_count: number;
  max_periods: number | null;
  billing_methods: PlanBillingMethod[];
  fulfillment_methods: PlanFulfillmentMethod[];
  preferred_weekday: number | null;
  renewal_lead_days: number;
  grace_days: number;
  max_active_members: number | null;
  created_at: string;
  items?: OfferPlanItem[];
  /** Instances that are active or past due, for the list. */
  active_count?: number;
}

/** What the storefront needs to render and sell a plan. */
export interface PublicOfferPlan {
  id: string;
  kind: OfferPlanKind;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price: number;
  interval_unit: IntervalUnit;
  interval_count: number;
  max_periods: number | null;
  fulfillment_methods: PlanFulfillmentMethod[];
  preferred_weekday: number | null;
  items: Array<{ product_id: string; name: string; image_url: string | null; quantity: number; price: number }>;
  /** Sum of the items at list price, for "Valor normal". */
  list_value: number;
}
