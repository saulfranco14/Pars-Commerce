const base =
  "inline-flex min-h-(--touch-target,44px) cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export const btnPrimary =
  `${base} bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70`.trim();

export const btnSecondary =
  `${base} border border-border text-muted-foreground hover:bg-border-soft/60 hover:text-foreground focus-visible:ring-accent/50`.trim();

export const btnDanger =
  `${base} border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-accent/50`.trim();

export const btnSecondarySmall =
  "inline-flex min-h-(--touch-target,44px) cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2";

export const btnDangerSmall =
  "inline-flex min-h-(--touch-target,44px) cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2";

export const btnPrimaryHeader = `${btnPrimary} w-full sm:w-auto`.trim();
export const btnSecondaryHeader = `${btnSecondary} w-full sm:w-auto`.trim();

export const btnPrimaryFlex = `${btnPrimary} flex-1`.trim();
export const btnSecondaryFlex = `${btnSecondary} flex-1`.trim();

export const btnIconSecondary =
  "flex min-h-(--touch-target,44px) min-w-(--touch-target,44px) cursor-pointer items-center justify-center rounded-lg border border-border text-muted transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:opacity-50";

export const btnIconDanger =
  "flex min-h-(--touch-target,44px) min-w-(--touch-target,44px) cursor-pointer items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:opacity-50";
