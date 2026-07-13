export const adminActionButtonSecondary =
  "inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-border-soft/40 disabled:cursor-not-allowed disabled:opacity-60 transition-colors";

export const adminActionButtonPrimary =
  "inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground shadow-sm shadow-accent/15 hover:bg-accent/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 transition-all";

export const adminActionButtonDanger =
  "inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-surface px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors";

/**
 * Confirm/approve action (e.g. validating a pending payment). Emerald is the
 * project's canonical success color (DESIGN_SYSTEM.md §3) — the only place a
 * filled non-accent button is allowed, because "aprobar un pago" is a success
 * affordance, not a primary navigation CTA.
 */
export const adminActionButtonConfirm =
  "inline-flex min-h-[36px] cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-emerald-600/15 hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 transition-all";

/**
 * The homologated page-header primary CTA (DESIGN_SYSTEM.md §4.7). Shared here
 * so list pages (mesas, qr, inicio, …) import ONE string instead of each
 * copy-pasting it — the audit found this duplicated across pages.
 */
export const pageHeaderCta =
  "inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] transition-all";
