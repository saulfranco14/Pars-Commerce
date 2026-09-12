/**
 * Platform treasury dashboard (S5). Aggregates all settlements so the platform
 * (super admin) can answer at a glance: how much do we owe, to whom, what's
 * pending confirmation, what's disputed.
 *
 * Read-only aggregation over what S1-S4 already built — no new concepts.
 * Server-only (admin client): it's cross-tenant, gated by isPlatformAdmin at
 * the route.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SettlementStatusSummary {
  status: string;
  count: number;
  total_to_transfer: number;
}

export interface TenantOwed {
  tenant_id: string;
  open_settlements: number;
  total_to_transfer: number;
}

export interface PlatformDashboard {
  /** Settlements grouped by status, with count + money in each. */
  by_status: SettlementStatusSummary[];
  /** Total money the platform still owes (not yet transfer_confirmed). */
  total_outstanding: number;
  /** Total commission earned across all confirmed settlements. */
  commission_confirmed: number;
  /** Per-tenant outstanding, highest first — who to pay next. */
  owed_by_tenant: TenantOwed[];
  /** Settlements needing action (closed/transfer_pending) — the work queue. */
  needs_action: number;
  disputed: number;
}

interface SettlementRow {
  tenant_id: string;
  status: string;
  amount_to_transfer: number;
  platform_commission: number;
}

// A settlement is "outstanding" (platform still owes) until transfer_confirmed.
const OUTSTANDING = new Set(["open", "closed", "transfer_pending"]);
// Actionable = the platform needs to do something (close / send transfer).
const ACTIONABLE = new Set(["closed", "transfer_pending"]);

export async function getPlatformDashboard(
  admin: SupabaseClient,
): Promise<PlatformDashboard> {
  const { data } = await admin
    .from("settlements")
    .select("tenant_id, status, amount_to_transfer, platform_commission");

  const rows = (data ?? []) as SettlementRow[];

  const byStatusMap = new Map<string, { count: number; total: number }>();
  const owedMap = new Map<string, { count: number; total: number }>();
  let totalOutstanding = 0;
  let commissionConfirmed = 0;
  let needsAction = 0;
  let disputed = 0;

  for (const r of rows) {
    const amt = Number(r.amount_to_transfer);

    const bs = byStatusMap.get(r.status) ?? { count: 0, total: 0 };
    bs.count += 1;
    bs.total += amt;
    byStatusMap.set(r.status, bs);

    if (OUTSTANDING.has(r.status)) {
      totalOutstanding += amt;
      const o = owedMap.get(r.tenant_id) ?? { count: 0, total: 0 };
      o.count += 1;
      o.total += amt;
      owedMap.set(r.tenant_id, o);
    }
    if (r.status === "transfer_confirmed") {
      commissionConfirmed += Number(r.platform_commission);
    }
    if (ACTIONABLE.has(r.status)) needsAction += 1;
    if (r.status === "disputed") disputed += 1;
  }

  return {
    by_status: [...byStatusMap.entries()].map(([status, v]) => ({
      status,
      count: v.count,
      total_to_transfer: round2(v.total),
    })),
    total_outstanding: round2(totalOutstanding),
    commission_confirmed: round2(commissionConfirmed),
    owed_by_tenant: [...owedMap.entries()]
      .map(([tenant_id, v]) => ({
        tenant_id,
        open_settlements: v.count,
        total_to_transfer: round2(v.total),
      }))
      .sort((a, b) => b.total_to_transfer - a.total_to_transfer),
    needs_action: needsAction,
    disputed,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
