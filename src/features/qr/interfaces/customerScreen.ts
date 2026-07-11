import type { ReactNode } from "react";

/**
 * Props for <CustomerScreen> — the single layout every /q/** screen uses.
 * Lives outside the component (ARCHITECTURE.md §1: no inline interfaces).
 */
export interface CustomerScreenProps {
  /** Compact accent header content (logo + label + amount protagonist). */
  header: ReactNode;
  /** Scrollable body content (cards, lists, forms). */
  children: ReactNode;
  /**
   * Fixed bottom action bar (primary CTA). Rendered pinned to the viewport
   * bottom, centered to the content column, with safe-area padding. This is
   * a first-class slot — every actionable screen fills it.
   */
  footer?: ReactNode;
  /** Accent tone for the header. Default "accent". */
  tone?: "accent" | "success" | "pending" | "danger";
  /** Optional back button href (top-left of header). */
  backHref?: string;
  /** Optional back button handler (top-left of header). */
  onBack?: () => void;
  /** Tenant name shown as eyebrow in the header. */
  tenantName?: string;
}
