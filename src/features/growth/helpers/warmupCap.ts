const START_CAP = 10;
const WEEKLY_STEP = 5;

/** New mailboxes start at 10 emails a day and add 5 each week until their own cap. */
export function warmupCap(warmupStartedOn: string | null, dailyCap: number, today: Date): number {
  if (!warmupStartedOn) return Math.min(START_CAP, dailyCap);
  const started = new Date(`${warmupStartedOn}T00:00:00Z`).getTime();
  const days = Math.max(0, Math.floor((today.getTime() - started) / 86_400_000));
  return Math.min(dailyCap, START_CAP + Math.floor(days / 7) * WEEKLY_STEP);
}
