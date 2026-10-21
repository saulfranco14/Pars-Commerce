/** Selectable option card shared by every guided wizard (onboarding, offers). */
export const OPTION_CARD = {
  base: "cursor-pointer rounded-2xl border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
  selected: "border-foreground ring-1 ring-foreground",
  idle: "border-border hover:border-accent/40",
} as const;

/** Pill choice (presets like 15%, "Cada mes", a weekday). */
export const CHOICE_CHIP = {
  base: "min-h-11 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
  on: "border-accent bg-accent text-accent-foreground",
  off: "border-border bg-surface text-foreground hover:border-accent/40",
} as const;

export const FIELD_LABEL = "mb-2 block text-sm font-semibold text-foreground";
