import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateCycleDue } from "@/features/settlement/helpers/cycleDue";
import { createSettlement } from "@/features/settlement/services/createSettlement";
import type { SettlementCycle } from "@/constants/platformCommission";
import { NextResponse } from "next/server";

/**
 * POST /api/settlement-run — the scheduler (S4). Meant to be called by a cron
 * (Vercel Cron / external scheduler), NOT by users. It sweeps every tenant's
 * settlement config, and for each whose cycle is due, creates a settlement for
 * the elapsed period and stamps last_settled_at.
 *
 * Auth: a shared secret in the `x-cron-secret` header (CRON_SECRET). No user
 * session — this is machine-to-machine. Without the secret set, the endpoint
 * refuses to run (fail closed) so it can't be triggered by accident.
 *
 * `now` can be overridden via ?now=ISO for testing determinism.
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  }
  if (request.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const nowParam = new URL(request.url).searchParams.get("now");
  const now = nowParam ? new Date(nowParam) : new Date();
  if (Number.isNaN(now.getTime())) {
    return NextResponse.json({ error: "invalid now" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: configs, error } = await admin
    .from("tenant_settlement_config")
    .select("tenant_id, cycle_type, custom_cycle_days, commission_override, last_settled_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    tenant_id: string;
    outcome: "settled" | "not_due" | "nothing_to_settle" | "error";
    settlement_id?: string;
    amount_to_transfer?: number;
    detail?: string;
  }> = [];

  for (const cfg of configs ?? []) {
    const due = evaluateCycleDue(
      cfg.cycle_type as SettlementCycle,
      cfg.last_settled_at,
      now,
      cfg.custom_cycle_days,
    );
    if (!due.due) {
      results.push({ tenant_id: cfg.tenant_id, outcome: "not_due" });
      continue;
    }

    const res = await createSettlement(admin, {
      tenantId: cfg.tenant_id,
      cycle: cfg.cycle_type as SettlementCycle,
      periodStart: due.periodStart,
      periodEnd: due.periodEnd,
      overridePercent: cfg.commission_override ?? undefined,
    });

    if (!res.ok) {
      // "nothing to settle" (no MP charges) isn't an error — the cycle just had
      // no MP money. Still stamp last_settled_at so we don't retry every run.
      const nothing =
        res.error.code === "validation" || res.error.code === "conflict";
      await admin
        .from("tenant_settlement_config")
        .update({ last_settled_at: due.periodEnd })
        .eq("tenant_id", cfg.tenant_id);
      results.push({
        tenant_id: cfg.tenant_id,
        outcome: nothing ? "nothing_to_settle" : "error",
        detail: res.error.message,
      });
      continue;
    }

    await admin
      .from("tenant_settlement_config")
      .update({ last_settled_at: due.periodEnd })
      .eq("tenant_id", cfg.tenant_id);

    results.push({
      tenant_id: cfg.tenant_id,
      outcome: "settled",
      settlement_id: res.data.settlementId,
      amount_to_transfer: res.data.amountToTransfer,
    });
  }

  return NextResponse.json({
    ran_at: now.toISOString(),
    processed: results.length,
    settled: results.filter((r) => r.outcome === "settled").length,
    results,
  });
}
