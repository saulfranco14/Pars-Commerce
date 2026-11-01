import type { VariantStats } from "@/features/growth/interfaces/template";

/** Sends a variant needs before its open rate is trusted. */
export const VARIANT_MIN_SAMPLE = 15;
/** Out of 10 leads, how many get the variant that opens best once every variant has its sample. */
const BEST_SHARE = 7;

/** Stable number from a string, so a lead always gets the same variant when nothing else decides. */
function seedOf(value: string): number {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

/** Share of leads that opened their store after this variant, with one imaginary open and miss so small samples don't win. */
export function openRate(stats: VariantStats | undefined): number {
  return ((stats?.opened ?? 0) + 1) / ((stats?.sent ?? 0) + 2);
}

/** The variant that opens best once all have their sample; null while any is still collecting it. */
export function winningVariant<T extends string>(available: T[], stats: Partial<Record<string, VariantStats>>): T | null {
  if (available.length < 2 || available.some((variant) => (stats[variant]?.sent ?? 0) < VARIANT_MIN_SAMPLE)) return null;
  return [...available].sort((a, b) => openRate(stats[b]) - openRate(stats[a]))[0];
}

/**
 * The variant to show: the one the operator asked for, else one this lead has not received for the step.
 * With stats, variants short of a sample go first; then 7 of 10 leads get the best one and the rest keep testing.
 * Never random: the lead id decides, so reopening the composer shows the same message.
 */
export function pickVariant<T extends string>(
  available: T[],
  options: { requested?: T; sent: string[]; seed: string; stats?: Partial<Record<string, VariantStats>> },
): T | null {
  if (!available.length) return null;
  if (options.requested && available.includes(options.requested)) return options.requested;
  const sorted = [...available].sort();
  const fresh = sorted.filter((variant) => !options.sent.includes(variant));
  const pool = fresh.length ? fresh : sorted;
  const seed = seedOf(options.seed);
  if (options.stats && pool.length > 1) {
    const learning = pool.filter((variant) => (options.stats?.[variant]?.sent ?? 0) < VARIANT_MIN_SAMPLE);
    if (learning.length) return learning[seed % learning.length];
    const best = winningVariant(pool, options.stats) ?? pool[0];
    if (seed % 10 < BEST_SHARE) return best;
    const others = pool.filter((variant) => variant !== best);
    return others[Math.floor(seed / 10) % others.length];
  }
  return pool[seed % pool.length];
}
