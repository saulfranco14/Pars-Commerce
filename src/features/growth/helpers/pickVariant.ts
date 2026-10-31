/** Stable number from a string, so a lead always gets the same variant when nothing else decides. */
function seedOf(value: string): number {
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}

/**
 * The variant to show: the one the operator asked for, else one this lead has not received for the step,
 * else the lead's own. Never random, so reopening the composer shows the same message.
 */
export function pickVariant<T extends string>(available: T[], options: { requested?: T; sent: string[]; seed: string }): T | null {
  if (!available.length) return null;
  if (options.requested && available.includes(options.requested)) return options.requested;
  const sorted = [...available].sort();
  const fresh = sorted.filter((variant) => !options.sent.includes(variant));
  const pool = fresh.length ? fresh : sorted;
  return pool[seedOf(options.seed) % pool.length];
}
