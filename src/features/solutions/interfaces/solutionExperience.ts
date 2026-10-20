import type { LucideIcon } from "lucide-react";

import type { CatalogStartMode } from "@/features/auth/registrationIntent";
import type { CatalogItemDefinition } from "@/features/catalog/catalogDefinitions";

export type Journey = "customer" | "orders" | "checkout";

export type OrderStage = "shopping" | "received" | "preparing" | "ready" | "paid";

export type PaymentMethod = "Efectivo" | "Transferencia" | "En línea";

export type CapabilityKey =
  | "store"
  | "payments"
  | "schedule"
  | "promotions"
  | "memberships"
  | "credit"
  | "kiosk";

export interface SolutionCapability {
  key: CapabilityKey;
  title: string;
  short: string;
  promise: string;
  benefits: [string, string, string];
  action: string;
  completed: string;
  icon: LucideIcon;
}

export interface CartLine {
  item: CatalogItemDefinition;
  quantity: number;
}

export interface ThemeChoice {
  key: string;
  label: string;
  color: string;
}

export interface OnboardingGoal {
  id: string;
  title: string;
  text: string;
  icon: LucideIcon;
}

export interface CatalogModeOption {
  id: CatalogStartMode;
  title: string;
  text: string;
  recommended?: boolean;
}
