const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-(--store-canvas)";

export const storeFocusRing = FOCUS;

export const storeButtonPrimary = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-accent-foreground transition-[background-color,transform] hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60 motion-safe:active:scale-[0.98] ${FOCUS}`;

export const storeButtonSecondary = `inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-(--store-surface) px-5 text-[15px] font-semibold text-(--store-ink) ring-1 ring-(--store-hairline) transition-[background-color,transform] hover:bg-(--store-well) motion-safe:active:scale-[0.98] ${FOCUS}`;

export const storeTextLink = `inline-flex min-h-11 items-center gap-1 rounded-md text-[15px] font-medium text-(--store-ink) underline-offset-4 hover:underline ${FOCUS}`;

export const storeCard =
  "overflow-hidden rounded-(--store-radius) bg-(--store-surface) ring-1 ring-(--store-hairline)";

export const storeDisplayFont = "font-(family-name:--store-display)";

export const storeChip = `inline-flex min-h-10 shrink-0 cursor-pointer items-center rounded-full px-4 text-sm font-medium transition-colors ${FOCUS}`;

export const storeChipIdle = "bg-(--store-surface) text-(--store-ink) ring-1 ring-(--store-hairline) hover:bg-(--store-well)";

export const storeChipActive = "bg-(--store-ink) text-(--store-canvas)";
