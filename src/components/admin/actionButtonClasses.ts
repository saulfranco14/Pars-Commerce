export const adminActionButtonSecondary =
  "inline-flex min-h-(--touch-target,44px) cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-border-soft/60 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2";

export const adminActionButtonPrimary =
  "inline-flex min-h-(--touch-target,44px) cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground shadow-sm shadow-accent/15 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

export const adminActionButtonDanger =
  "inline-flex min-h-(--touch-target,44px) cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-surface px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2";

/**
 * Confirm/approve action (e.g. validating a pending payment). Emerald is the
 * project's canonical success color (DESIGN_SYSTEM.md §3) — the only place a
 * filled non-accent button is allowed, because "aprobar un pago" is a success
 * affordance, not a primary navigation CTA.
 */
export const adminActionButtonConfirm =
  "inline-flex min-h-(--touch-target,44px) cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-emerald-600/15 transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

/**
 * The homologated page-header primary CTA (DESIGN_SYSTEM.md §4.7). Shared here
 * so list pages (mesas, qr, inicio, …) import ONE string instead of each
 * copy-pasting it — the audit found this duplicated across pages.
 */
export const pageHeaderCta =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] transition-all";
