// Unattended screen: without a reset the next customer inherits the previous
// cart. Same privacy rule as `device_name` on tables (CLAUDE.md §6).
export const DEFAULT_IDLE_RESET_SECONDS = 60;

/** Seconds of warning before the reset, so nobody loses a cart mid-thought. */
export const IDLE_WARNING_SECONDS = 15;

/** Most Studio ads the waiting screen passes, newest first. */
export const KIOSK_MAX_ADS = 8;

/** Seconds each ad stays on the waiting screen. */
export const KIOSK_AD_SECONDS = 7;
