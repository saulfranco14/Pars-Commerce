/**
 * Props for <BrandImage> — the shared 3-tier image fallback used across
 * customer-facing QR screens. Lives outside the component so consumers share
 * one contract (ARCHITECTURE.md §1: no inline interfaces).
 */
export interface BrandImageProps {
  /** Primary image (e.g. product photo). Tier 1. */
  src?: string | null;
  /** Tenant logo, used when `src` is absent. Tier 2. */
  logoUrl?: string | null;
  /** Business/tenant name, used to derive initials. Tier 3. */
  name?: string | null;
  /** Alt text for whichever image renders. */
  alt: string;
  /** Extra classes on the outer tile (e.g. aspect ratio, rounding). */
  className?: string;
  /** Rounding of the tile. Default "rounded-none" (card handles clipping). */
  rounded?: string;
}
