"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { CustomerScreenProps } from "@/features/qr/interfaces/customerScreen";

const TONE_BG: Record<NonNullable<CustomerScreenProps["tone"]>, string> = {
  accent: "bg-accent text-accent-foreground",
  success: "bg-emerald-600 text-white",
  pending: "bg-accent text-accent-foreground",
  danger: "bg-red-600 text-white",
};

/**
 * The single mobile-first layout for every customer-facing QR screen
 * (DESIGN_SYSTEM.md §4.1). Structure:
 *
 *   ┌──────────────────────────┐
 *   │  compact accent header   │  ← flat accent, logo + label + AMOUNT
 *   ├──────────────────────────┤
 *   │  neutral body (scrolls)  │  ← cards / lists / forms
 *   │                          │
 *   ├──────────────────────────┤
 *   │  fixed action bar (CTA)  │  ← pinned to viewport bottom, always visible
 *   └──────────────────────────┘
 *
 * One centered column (max-w-lg) on every breakpoint — no empty split-pane
 * on desktop. The header is compact (never a full-height pink void), the
 * amount is the protagonist, and the footer CTA is a first-class fixed slot.
 * Flat accent, no gradients/blobs.
 */
export function CustomerScreen({
  header,
  children,
  footer,
  tone = "accent",
  backHref,
  onBack,
  tenantName,
}: CustomerScreenProps) {
  const back =
    backHref || onBack ? (
      backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Link>
      ) : (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm transition-colors hover:bg-white/25"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
      )
    ) : null;

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
        {/* Compact accent header */}
        <header
          className={`${TONE_BG[tone]} rounded-b-[28px] px-5 pb-6 pt-5 shadow-sm`}
        >
          {(back || tenantName) && (
            <div className="mb-4 flex items-center justify-between gap-2">
              {back ?? <span />}
              {tenantName && (
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-85">
                  {tenantName}
                </span>
              )}
            </div>
          )}
          {header}
        </header>

        {/* Neutral body — scrolls, padded to clear the fixed footer */}
        <main
          className={`flex-1 px-5 pt-5 ${footer ? "pb-40" : "pb-10"}`}
        >
          {children}
        </main>
      </div>

      {/* Fixed action bar — centered to the column, safe-area aware */}
      {footer && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm">
          <div
            className="mx-auto w-full max-w-lg px-5 py-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
