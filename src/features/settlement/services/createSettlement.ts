/**
 * Domain service (S3): create a settlement for a tenant over a period.
 *
 * Reads the platform-custodied (MP) charges of the period from payment_ledger,
 * sums gross/fees/net, applies the platform commission (S2), and writes the
 * settlement + its settlement_items in one shot. Idempotent by design:
 * settlement_items has UNIQUE(source_table, source_id), so a charge already
 * settled in a prior run can't be double-counted.
 *
 * Server-only: receives an admin Supabase client (service_role) — settlements
 * are platform-managed, not written by tenant APIs.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  calcPlatformCommission,
  type SettlementCycle,
} from "@/constants/platformCommission";

export interface ServiceError {
  code: "not_found" | "validation" | "conflict" | "internal";
  message: string;
}
export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError };

export interface CreateSettlementInput {
  tenantId: string;
  cycle: SettlementCycle;
  periodStart: string; // ISO
  periodEnd: string; // ISO
  /** Contract override for the commission percent (required if cycle==='custom'). */
  overridePercent?: number;
}

export interface CreateSettlementResult {
  settlementId: string;
  grossMp: number;
  netMp: number;
  platformCommission: number;
  amountToTransfer: number;
  itemCount: number;
}

interface LedgerRow {
  source_table: string;
  source_id: string;
  amount_gross: number;
  fee_amount: number;
  net_amount: number;
}

export async function createSettlement(
  admin: SupabaseClient,
  input: CreateSettlementInput,
): Promise<ServiceResult<CreateSettlementResult>> {
  if (new Date(input.periodEnd) <= new Date(input.periodStart)) {
    return {
      ok: false,
      error: { code: "validation", message: "periodEnd debe ser posterior a periodStart" },
    };
  }

  // Platform-custodied (MP) charges of the period that are NOT already in a
  // settlement. The left-anti-join is done in app code: fetch candidates, then
  // drop any whose (source_table, source_id) is already in settlement_items.
  const { data: ledgerRows, error: ledgerErr } = await admin
    .from("payment_ledger")
    .select("source_table, source_id, amount_gross, fee_amount, net_amount")
    .eq("tenant_id", input.tenantId)
    .eq("is_platform_custodied", true)
    .gte("created_at", input.periodStart)
    .lte("created_at", input.periodEnd);

  if (ledgerErr) {
    return { ok: false, error: { code: "internal", message: ledgerErr.message } };
  }

  const candidates = (ledgerRows ?? []) as LedgerRow[];
  if (candidates.length === 0) {
    return {
      ok: false,
      error: { code: "validation", message: "No hay cobros MP a liquidar en el periodo" },
    };
  }

  // Exclude charges already settled (idempotency at selection time; the UNIQUE
  // on settlement_items is the hard guarantee).
  const keys = candidates.map((c) => c.source_id);
  const { data: already } = await admin
    .from("settlement_items")
    .select("source_table, source_id")
    .in("source_id", keys);
  const settledSet = new Set(
    (already ?? []).map((a) => `${a.source_table}:${a.source_id}`),
  );
  const fresh = candidates.filter(
    (c) => !settledSet.has(`${c.source_table}:${c.source_id}`),
  );

  if (fresh.length === 0) {
    return {
      ok: false,
      error: { code: "conflict", message: "Todos los cobros del periodo ya fueron liquidados" },
    };
  }

  const grossMp = round2(fresh.reduce((s, r) => s + Number(r.amount_gross), 0));
  const mpFees = round2(fresh.reduce((s, r) => s + Number(r.fee_amount), 0));
  const netMp = round2(fresh.reduce((s, r) => s + Number(r.net_amount), 0));

  let commission;
  try {
    commission = calcPlatformCommission(netMp, input.cycle, input.overridePercent);
  } catch (e) {
    return {
      ok: false,
      error: { code: "validation", message: e instanceof Error ? e.message : String(e) },
    };
  }

  // Create the settlement header.
  const { data: settlement, error: insErr } = await admin
    .from("settlements")
    .insert({
      tenant_id: input.tenantId,
      cycle_type: input.cycle,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      gross_mp_amount: grossMp,
      mp_fees_total: mpFees,
      net_mp_amount: netMp,
      commission_percent: commission.commissionPercent,
      platform_commission: commission.commissionAmount,
      amount_to_transfer: commission.amountToTransfer,
      status: "open",
      snapshot: {
        item_count: fresh.length,
        gross_mp: grossMp,
        net_mp: netMp,
        commission_percent: commission.commissionPercent,
      },
    })
    .select("id")
    .single();

  if (insErr || !settlement) {
    // 23505 = the period was already settled (unique tenant+period).
    const conflict = insErr?.code === "23505";
    return {
      ok: false,
      error: {
        code: conflict ? "conflict" : "internal",
        message: conflict
          ? "Este periodo ya tiene una liquidación"
          : insErr?.message ?? "No se pudo crear la liquidación",
      },
    };
  }

  // Link the charges. The UNIQUE(source_table, source_id) makes this the hard
  // idempotency barrier — if a concurrent run already claimed a charge, its
  // insert fails and that charge simply isn't double-settled.
  const itemsPayload = fresh.map((r) => ({
    settlement_id: settlement.id,
    source_table: r.source_table,
    source_id: r.source_id,
    gross_amount: Number(r.amount_gross),
    fee_amount: Number(r.fee_amount),
    net_amount: Number(r.net_amount),
  }));
  const { error: itemsErr } = await admin
    .from("settlement_items")
    .insert(itemsPayload);
  if (itemsErr) {
    // Roll back the header so we don't leave an empty settlement.
    await admin.from("settlements").delete().eq("id", settlement.id);
    return { ok: false, error: { code: "internal", message: itemsErr.message } };
  }

  return {
    ok: true,
    data: {
      settlementId: settlement.id,
      grossMp,
      netMp,
      platformCommission: commission.commissionAmount,
      amountToTransfer: commission.amountToTransfer,
      itemCount: fresh.length,
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
