import type { LucideIcon } from "lucide-react";

/** A pain the prospect recognizes, paired with what the platform does instead. */
export interface MesasPain {
  key: string;
  /** The complaint in the owner's own words. */
  pain: string;
  /** What Tlaco does about it. */
  solution: string;
  icon: LucideIcon;
}

/** Who this is for — used by the audience chips (multinegocio, not just food). */
export interface MesasAudience {
  key: string;
  label: string;
  /** Concrete example of the flow for this kind of business. */
  example: string;
  icon: LucideIcon;
}
