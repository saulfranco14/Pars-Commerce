/** Selectable option card shared by every guided wizard (onboarding, offers). */
export const OPTION_CARD = {
  base: "cursor-pointer rounded-2xl border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
  selected: "border-foreground ring-1 ring-foreground",
  idle: "border-border hover:border-accent/40",
} as const;
