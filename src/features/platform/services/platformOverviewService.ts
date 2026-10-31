import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlatformOverview } from "@/features/platform/interfaces/overview";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export const OVERVIEW_DAYS = [7, 30, 90];

/** Registrations, stores, Mercado Pago, sales and visits for the last `days`, aggregated in SQL. */
export async function getPlatformOverview(admin: SupabaseClient, days: number): Promise<ServiceResult<PlatformOverview>> {
  const span = OVERVIEW_DAYS.includes(days) ? days : 30;
  const to = new Date();
  const from = new Date(to.getTime() - span * 86_400_000);
  const { data, error } = await admin.rpc("platform_overview" as never, { p_from: from.toISOString(), p_to: to.toISOString() } as never);
  if (error) return { ok: false, error: { code: "internal", message: (error as { message: string }).message } };
  return { ok: true, data: { days: span, ...(data as unknown as Omit<PlatformOverview, "days">) } };
}
