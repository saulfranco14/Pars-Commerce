"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";

import { getInitials } from "@/features/qr/helpers/format";

import type { BrandImageProps } from "@/features/qr/interfaces/brandImage";

/**
 * Shared image tile with a 3-tier fallback so no customer-facing card ever
 * shows a bare placeholder icon (see DESIGN_SYSTEM.md — the amount/brand must
 * carry the screen). Resolution cascade:
 *
 *   1. `src`      → the actual photo (product image), object-cover.
 *   2. `logoUrl`  → the tenant's logo, object-contain on a soft tile.
 *   3. `name`     → a colored tile with the business initials.
 *   4. (fallback) → the Pars Commerce mark on an accent gradient.
 *
 * Pure presentational: no fetch, no state. Uses next/image (configured for
 * *.supabase.co in next.config.ts) so every photo is served AVIF/WebP at the
 * tile's real size instead of shipping the original upload — the same 96px
 * card tile no longer downloads a multi-MB phone-camera photo.
 */
export function BrandImage({
  src,
  logoUrl,
  name,
  alt,
  className = "",
  rounded = "rounded-none",
}: BrandImageProps) {
  const tileBase = `relative flex items-center justify-center overflow-hidden ${rounded} ${className}`;
  const trimmedName = name?.trim() ?? "";

  // Tier 1 — product photo.
  if (src) {
    return (
      <div className={`${tileBase} bg-border-soft/30`}>
        <Image
          src={src}
          alt={alt}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 96px, 128px"
          className="object-cover"
        />
      </div>
    );
  }

  // Tier 2 — tenant logo. object-cover + inherited radius so a logo that ships
  // with its own (often dark) square background fills the tile cleanly instead
  // of floating boxed inside padding.
  if (logoUrl) {
    return (
      <div className={`${tileBase} bg-border-soft/30`}>
        <Image
          src={logoUrl}
          alt={alt}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 96px, 128px"
          className={`object-cover ${rounded}`}
        />
      </div>
    );
  }

  // Tier 3 — business initials.
  if (trimmedName) {
    return (
      <div
        className={`${tileBase} bg-gradient-to-br from-accent/10 to-accent/25`}
        aria-label={alt}
        role="img"
      >
        <span className="text-2xl font-bold uppercase tracking-tight text-accent/70">
          {getInitials(trimmedName)}
        </span>
      </div>
    );
  }

  // Tier 4 — Pars Commerce mark.
  return (
    <div
      className={`${tileBase} bg-gradient-to-br from-accent/15 to-accent/30`}
      aria-label={alt}
      role="img"
    >
      <span className="flex flex-col items-center gap-1 text-accent/70">
        <Sparkles className="h-7 w-7" fill="currentColor" strokeWidth={0} />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
          pars
        </span>
      </span>
    </div>
  );
}
