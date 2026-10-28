import type { SweepLead } from "@/features/growth/interfaces/sweep";

/**
 * Adds freshly set-aside cards behind the ones on screen, so the current card never jumps.
 * `settled` are cards already marked whose save is still in flight.
 */
export function mergeSweepQueue(current: SweepLead[], incoming: SweepLead[], settled: ReadonlySet<string>): SweepLead[] {
  const seen = new Set(current.map((lead) => lead.id));
  const added = incoming.filter((lead) => !seen.has(lead.id) && !settled.has(lead.id));
  return [...current.filter((lead) => !settled.has(lead.id)), ...added];
}
