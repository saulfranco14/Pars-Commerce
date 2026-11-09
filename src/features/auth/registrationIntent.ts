import {
  PLAN_ORDER,
  type BillingPlanCode,
} from "@/features/billing/entitlements";

export type CatalogStartMode = "starter" | "own" | "assisted";

export interface RegistrationIntent {
  entryProduct?: "studio";
  studioPlan?: "basic" | "pro" | "business";
  studioAction?: "home" | "create";
  entryOrigin?: string;
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
  /** Raw "Para ti" token; only its hash is ever stored. */
  prospectToken?: string;
  heardFrom?: string;
}

type QueryReader = { get(name: string): string | null };

export function studioRegistrationMetadata(input: unknown) {
  const value =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  if ((value.entryProduct ?? value.entry_product) !== "studio") return {};
  const plan = value.studioPlan ?? value.studio_plan,
    action = value.studioAction ?? value.studio_action,
    origin = value.entryOrigin ?? value.entry_origin;
  return {
    entry_product: "studio" as const,
    studio_plan:
      plan === "basic" || plan === "pro" || plan === "business" ? plan : null,
    studio_action: action === "home" ? ("home" as const) : ("create" as const),
    entry_origin:
      typeof origin === "string" && /^[-a-z0-9_:/]{1,80}$/i.test(origin)
        ? origin
        : "studio",
  };
}

function cleanList(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().slice(0, 32))
    .filter(Boolean)
    .slice(0, 2);
}

export function parseRegistrationIntent(
  query: QueryReader,
): RegistrationIntent {
  const rawPlan = query.get("plan") ?? "free";
  const plan = PLAN_ORDER.includes(rawPlan as BillingPlanCode)
    ? (rawPlan as BillingPlanCode)
    : "free";
  const catalogStartMode = query.get("inicio_catalogo");
  return {
    ...(query.get("producto") === "studio"
      ? {
          entryProduct: "studio" as const,
          studioAction:
            query.get("studio_action") === "home"
              ? ("home" as const)
              : ("create" as const),
          entryOrigin: query.get("studio_origin")?.slice(0, 80) ?? "studio",
        }
      : {}),
    ...(["basic", "pro", "business"].includes(query.get("studio_plan") ?? "")
      ? { studioPlan: query.get("studio_plan") as "basic" | "pro" | "business" }
      : {}),
    plan,
    giro: query.get("giro")?.slice(0, 48) ?? "otro",
    solutionKey: query.get("solucion")?.slice(0, 48) || undefined,
    catalogKey: query.get("catalogo")?.slice(0, 48) || undefined,
    businessName: query.get("nombre")?.trim().slice(0, 80) || undefined,
    themeKey: query.get("tema")?.slice(0, 32) || undefined,
    primaryGoals: cleanList(query.get("objetivos")),
    catalogStartMode:
      catalogStartMode === "starter" ||
      catalogStartMode === "own" ||
      catalogStartMode === "assisted"
        ? catalogStartMode
        : "starter",
    onboardingSessionId: query.get("sesion")?.trim().slice(0, 80) || undefined,
    phone: query.get("telefono")?.trim().slice(0, 24) || undefined,
    assisted: query.get("asistido") === "1",
    prospectToken: query.get("prospecto")?.trim().slice(0, 64) || undefined,
  };
}

export function registrationIntentQuery(intent: RegistrationIntent): string {
  const query = new URLSearchParams({ plan: intent.plan, giro: intent.giro });
  if (intent.entryProduct === "studio") {
    query.set("producto", "studio");
    query.set("studio_action", intent.studioAction ?? "create");
    if (intent.studioPlan) query.set("studio_plan", intent.studioPlan);
    if (intent.entryOrigin) query.set("studio_origin", intent.entryOrigin);
  }
  if (intent.solutionKey) query.set("solucion", intent.solutionKey);
  if (intent.catalogKey) query.set("catalogo", intent.catalogKey);
  if (intent.businessName) query.set("nombre", intent.businessName);
  if (intent.themeKey) query.set("tema", intent.themeKey);
  if (intent.primaryGoals?.length)
    query.set("objetivos", intent.primaryGoals.join(","));
  if (intent.catalogStartMode)
    query.set("inicio_catalogo", intent.catalogStartMode);
  if (intent.onboardingSessionId)
    query.set("sesion", intent.onboardingSessionId);
  if (intent.phone) query.set("telefono", intent.phone);
  if (intent.assisted) query.set("asistido", "1");
  if (intent.prospectToken) query.set("prospecto", intent.prospectToken);
  return query.toString();
}
