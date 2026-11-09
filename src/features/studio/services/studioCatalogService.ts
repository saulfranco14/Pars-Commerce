import "server-only";
import { studioDb } from "./studioDb";
import { requireStudioData } from "./studioErrors";
import type { StudioPack, StudioPlan } from "../interfaces/studio";
import {
  STUDIO_PREVIEW_PACKS,
  STUDIO_PREVIEW_PLANS,
} from "../constants/marketing";

async function readStudioCatalog() {
  const db = studioDb();
  return Promise.all([
    db
      .from("studio_plans")
      .select(
        "code,name,amount_mxn,monthly_tlacos,monthly_reviews,catalog_version,is_active",
      )
      .eq("is_active", true)
      .order("amount_mxn"),
    db
      .from("studio_credit_packs")
      .select("code,name,amount_mxn,tlacos,catalog_version,is_active")
      .eq("is_active", true)
      .order("amount_mxn"),
  ]);
}

export async function getStudioCatalog(): Promise<{
  plans: StudioPlan[];
  packs: StudioPack[];
}> {
  const [plans, packs] = await readStudioCatalog();
  return {
    plans: requireStudioData(plans).map((p) => ({
      ...p,
      amount_mxn: Number(p.amount_mxn),
    })) as StudioPlan[],
    packs: requireStudioData(packs).map((p) => ({
      ...p,
      amount_mxn: Number(p.amount_mxn),
    })),
  };
}

export async function getStudioLandingCatalog(): Promise<{
  plans: StudioPlan[];
  packs: StudioPack[];
  status: "live" | "preview" | "unavailable";
}> {
  try {
    const [plans, packs] = await readStudioCatalog();
    const failure = plans.error ?? packs.error;
    if (failure) {
      const missingSchema = ["42P01", "PGRST205"].includes(failure.code);
      console.warn(
        `[studio] Public catalog unavailable (${failure.code || "unknown"}).${missingSchema ? " Apply the Studio migrations to the configured Supabase project." : " Check the database connection and catalog permissions."}`,
      );
      if (missingSchema && process.env.NODE_ENV === "development")
        return {
          plans: STUDIO_PREVIEW_PLANS,
          packs: STUDIO_PREVIEW_PACKS,
          status: "preview",
        };
      return { plans: [], packs: [], status: "unavailable" };
    }
    return {
      plans: (plans.data ?? []).map((p) => ({
        ...p,
        amount_mxn: Number(p.amount_mxn),
      })) as StudioPlan[],
      packs: (packs.data ?? []).map((p) => ({
        ...p,
        amount_mxn: Number(p.amount_mxn),
      })),
      status: plans.data?.length ? "live" : "unavailable",
    };
  } catch {
    console.warn(
      "[studio] Public catalog unavailable. Check the server Supabase configuration.",
    );
    return { plans: [], packs: [], status: "unavailable" };
  }
}
