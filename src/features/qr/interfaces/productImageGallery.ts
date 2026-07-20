/**
 * Props for <ProductImageGallery> — the swipeable multi-photo view used in
 * the customer-facing product detail sheet. Lives outside the component so
 * consumers share one contract (ARCHITECTURE.md §1: no inline interfaces).
 */
export interface ProductImageGalleryProps {
  /** All product photos, in display order. Empty/absent falls back to <BrandImage>. */
  images: string[];
  /** Tenant logo, used by the <BrandImage> fallback when `images` is empty. Tier 2. */
  logoUrl?: string | null;
  /** Business/tenant name, used by the <BrandImage> fallback to derive initials. Tier 3. */
  name?: string | null;
  /** Alt text for the images. */
  alt: string;
  /** Extra classes on the outer tile (e.g. aspect ratio, rounding). */
  className?: string;
  /** Rounding of the tile. Default "rounded-none" (card handles clipping). */
  rounded?: string;
}
