import type { LucideIcon } from "lucide-react";

/** One step of the interactive customer-flow demo (the phone simulator). */
export interface MesasDemoStep {
  key: string;
  /** Short label for the stepper dots / progress rail. */
  label: string;
  /** Headline shown next to the phone explaining what the visitor is seeing. */
  title: string;
  /** Plain-language benefit for the business owner, not a feature description. */
  description: string;
  /** Label of the button that advances the demo — phrased as the customer's action. */
  action: string;
  icon: LucideIcon;
}

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
