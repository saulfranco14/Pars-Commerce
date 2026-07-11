"use client";

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
 * Pure presentational: no fetch, no state. Uses a raw <img> (same as the rest
 * of the repo's menu — no next/image yet), lazy + async decoded.
 */
export function BrandImage({
  src,
  logoUrl,
  name,
  alt,
  className = "",
  rounded = "rounded-none",
}: BrandImageProps) {
  const tileBase = `flex items-center justify-center overflow-hidden ${rounded} ${className}`;
  const trimmedName = name?.trim() ?? "";

  // Tier 1 — product photo.
  if (src) {
    return (
      <div className={`${tileBase} bg-border-soft/30`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`h-full w-full object-cover ${rounded}`}
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
