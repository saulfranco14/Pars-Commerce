/**
 * S4 helper: given a cycle and when it was last settled, decide if it's due
 * now and what period the next settlement should cover. Pure — the scheduler
 * uses it to pick which tenants to settle, and the period bounds to pass to
 * createSettlement.
 *
 * `now` is passed in (not read from Date.now) so it's deterministic/testable.
 */
import type { SettlementCycle } from "@/constants/platformCommission";

const DAY_MS = 24 * 60 * 60 * 1000;

/** How many days each cycle spans. `custom` uses customCycleDays. */
export function cycleDurationDays(
  cycle: SettlementCycle,
  customCycleDays?: number | null,
): number {
  switch (cycle) {
    case "daily":
      return 1;
    case "weekly":
      return 7;
    case "biweekly":
      return 15;
    case "monthly":
      return 30;
    case "custom":
      return customCycleDays && customCycleDays >= 1 ? customCycleDays : 7;
  }
}

export interface DueResult {
  due: boolean;
  periodStart: string;
  periodEnd: string;
}

/**
 * Is this tenant's cycle due at `now`?
 *  - Never settled before → due, period = [epoch-ish start, now].
 *  - Settled before → due only if a full cycle has elapsed since last settle;
 *    period = [lastSettledAt, now].
 */
export function evaluateCycleDue(
  cycle: SettlementCycle,
  lastSettledAt: string | null,
  now: Date,
  customCycleDays?: number | null,
): DueResult {
  const spanMs = cycleDurationDays(cycle, customCycleDays) * DAY_MS;

  if (!lastSettledAt) {
    // First settlement: cover everything up to now. A far-past start keeps the
    // ledger query simple (createSettlement filters by is_platform_custodied).
    return {
      due: true,
      periodStart: new Date(0).toISOString(),
      periodEnd: now.toISOString(),
    };
  }

  const last = new Date(lastSettledAt).getTime();
  const elapsed = now.getTime() - last;
  return {
    due: elapsed >= spanMs,
    periodStart: new Date(last).toISOString(),
    periodEnd: now.toISOString(),
  };
}
