/**
 * S4 helper: preview of what each settlement cycle costs a business, so they
 * can compare BEFORE choosing ("if you pick monthly, your commission is 2%
 * instead of 3.5% daily"). Pure — reuses the S2 commission function.
 */
import {
  PLATFORM_COMMISSION_BY_CYCLE,
  calcPlatformCommission,
  SETTLEMENT_CYCLES,
  type SettlementCycle,
} from "@/constants/platformCommission";

export interface CyclePreviewRow {
  cycle: SettlementCycle;
  commissionPercent: number | null; // null for custom without an override
  /** On a sample net amount, what the business would receive. */
  amountToTransfer: number | null;
}

/**
 * Preview every selectable cycle against a sample net MP amount. `custom` is
 * shown with the override if given, else as "por contrato" (null percent).
 */
export function previewCycles(
  sampleNetMp: number,
  customOverride?: number,
): CyclePreviewRow[] {
  return SETTLEMENT_CYCLES.map((cycle) => {
    if (cycle === "custom") {
      if (customOverride == null) {
        return { cycle, commissionPercent: null, amountToTransfer: null };
      }
      const r = calcPlatformCommission(sampleNetMp, "custom", customOverride);
      return {
        cycle,
        commissionPercent: r.commissionPercent,
        amountToTransfer: r.amountToTransfer,
      };
    }
    const r = calcPlatformCommission(sampleNetMp, cycle);
    return {
      cycle,
      commissionPercent: r.commissionPercent,
      amountToTransfer: r.amountToTransfer,
    };
  });
}

/** The commission percent for a cycle (for showing a single chosen cycle). */
export function commissionPercentForCycle(
  cycle: SettlementCycle,
  override?: number,
): number | null {
  if (override != null) return override;
  if (cycle === "custom") return null;
  return PLATFORM_COMMISSION_BY_CYCLE[cycle];
}
