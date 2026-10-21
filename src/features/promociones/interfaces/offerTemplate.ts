import type { LucideIcon } from "lucide-react";

import type { PlanInterval } from "@/lib/offers/planPeriods";

export type OfferKind = "promotion" | "subscription" | "membership";

export type PromotionMechanic =
  | "percentage"
  | "fixed_amount"
  | "fixed_price"
  | "nxm"
  | "bundle_price"
  | "event_badge";

export type ValidityPreset = "none" | "weekend" | "week" | "month" | "custom";

export interface OfferTemplateDefaults {
  value?: number;
  buyQuantity?: number;
  payQuantity?: number;
  badgeLabel?: string;
  appliesToAll?: boolean;
  validity?: ValidityPreset;
  /** Suggested pack price as a share of the pack's list value (0.9 = 10% off). */
  packPriceRatio?: number;
  planInterval?: PlanInterval;
  planFulfillment?: ReadonlyArray<"pickup" | "delivery">;
  /** Index of Date#getDay(). */
  planWeekday?: number;
}

export interface OfferTemplate {
  key: string;
  kind: OfferKind;
  /** Business types it is written for, or every business. */
  verticals: readonly string[] | "all";
  title: string;
  description: string;
  example: string;
  icon: LucideIcon;
  mechanic?: PromotionMechanic;
  defaults?: OfferTemplateDefaults;
  /** Words that float matching catalog items to the top of the picker. */
  keywords?: readonly string[];
  /** Memberships arrive in a later phase. */
  available: boolean;
}

export interface PromotionMechanicOption {
  value: PromotionMechanic;
  title: string;
  description: string;
  example: string;
  icon: LucideIcon;
}
