import { PLAN_ORDER, type BillingPlanCode } from "@/features/billing/entitlements";

export type CatalogStartMode = "starter" | "own" | "assisted";

export interface RegistrationIntent {
  plan: BillingPlanCode;
  giro: string;
  solutionKey?: string;
  catalogKey?: string;
  businessName?: string;
  themeKey?: string;
  primaryGoals?: string[];
  catalogStartMode?: CatalogStartMode;
  onboardingSessionId?: string;
  phone?: string;
  assisted?: boolean;
}

type QueryReader = { get(name: string): string | null };

function cleanList(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().slice(0, 32))
    .filter(Boolean)
    .slice(0, 2);
}

export function parseRegistrationIntent(query: QueryReader): RegistrationIntent {
  const rawPlan = query.get("plan") ?? "free";
  const plan = PLAN_ORDER.includes(rawPlan as BillingPlanCode) ? rawPlan as BillingPlanCode : "free";
  const catalogStartMode = query.get("inicio_catalogo");
  return {
    plan,
    giro: query.get("giro")?.slice(0, 48) ?? "otro",
    solutionKey: query.get("solucion")?.slice(0, 48) || undefined,
    catalogKey: query.get("catalogo")?.slice(0, 48) || undefined,
    businessName: query.get("nombre")?.trim().slice(0, 80) || undefined,
    themeKey: query.get("tema")?.slice(0, 32) || undefined,
    primaryGoals: cleanList(query.get("objetivos")),
    catalogStartMode: catalogStartMode === "starter" || catalogStartMode === "own" || catalogStartMode === "assisted" ? catalogStartMode : "starter",
    onboardingSessionId: query.get("sesion")?.trim().slice(0, 80) || undefined,
    phone: query.get("telefono")?.trim().slice(0, 24) || undefined,
    assisted: query.get("asistido") === "1",
  };
}

export function registrationIntentQuery(intent: RegistrationIntent): string {
  const query = new URLSearchParams({ plan: intent.plan, giro: intent.giro });
  if (intent.solutionKey) query.set("solucion", intent.solutionKey);
  if (intent.catalogKey) query.set("catalogo", intent.catalogKey);
  if (intent.businessName) query.set("nombre", intent.businessName);
  if (intent.themeKey) query.set("tema", intent.themeKey);
  if (intent.primaryGoals?.length) query.set("objetivos", intent.primaryGoals.join(","));
  if (intent.catalogStartMode) query.set("inicio_catalogo", intent.catalogStartMode);
  if (intent.onboardingSessionId) query.set("sesion", intent.onboardingSessionId);
  if (intent.phone) query.set("telefono", intent.phone);
  if (intent.assisted) query.set("asistido", "1");
  return query.toString();
}
