"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface CustomerScreenLayoutProps {
  /** Hero content (eyebrow + title + amount + status pills). */
  hero: ReactNode;
  /** Body content (cards, lists, forms). */
  children: ReactNode;
  /** Hero accent — defaults to `bg-accent`. Use `bg-emerald-600` for
   *  approved/paid states or `bg-red-600` for failures. */
  heroBgClass?: string;
  /** Optional href for the back button (top-left of hero). */
  backHref?: string;
  /** Optional click handler for the back button (top-left of hero). */
  onBack?: () => void;
  /** Optional tenant name shown as eyebrow in the top-right of the hero. */
  tenantName?: string;
  /** Hide the mobile grabber when the body should feel fully attached
   *  (e.g. the receipt page that doesn't simulate a sheet). */
  hideGrabber?: boolean;
}

/**
 * Canonical layout for every customer-facing QR screen.
 *
 *   ┌─────────────────────────┬─────────────────────────┐
 *   │                         │                         │
 *   │      HERO (accent)      │      BODY (form/cards)  │   <-- desktop (lg+)
 *   │                         │                         │
 *   └─────────────────────────┴─────────────────────────┘
 *
 *   ┌─────────────────────────┐
 *   │      HERO (accent)      │
 *   ├─────────────────────────┤
 *   │   BODY sheet slides up  │   <-- mobile
 *   └─────────────────────────┘
 *
 * Used by:
 *   - TipScreen (propinas)
 *   - Bill page (tu cuenta)
 *   - PaymentReceipt screen (recibo)
 *   - QR payment success page
 *
 * Layout rules (see DESIGN_SYSTEM.md §4.1):
 *   - Hero takes the upper half on mobile, the left half on desktop.
 *   - Body uses a rounded-t-3xl sheet on mobile, flat on desktop.
 *   - Max content width on desktop: 6xl (1152 px); each pane: ~lg.
 */
export function CustomerScreenLayout({
  hero,
  children,
  heroBgClass = "bg-accent",
  backHref,
  onBack,
  tenantName,
  hideGrabber,
}: CustomerScreenLayoutProps) {
  const fgClass = heroBgClass.includes("emerald")
    ? "text-white"
    : heroBgClass.includes("red")
      ? "text-white"
      : "text-accent-foreground";

  const BackEl =
    backHref || onBack ? (
      backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm hover:bg-white/25 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </Link>
      ) : (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm hover:bg-white/25 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
      )
    ) : null;

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh w-full max-w-6xl lg:grid-cols-[1fr_1fr]">
        {/* ── Hero pane ── */}
        <section
          className={`relative isolate overflow-hidden ${heroBgClass} ${fgClass} px-5 pb-12 pt-6 lg:flex lg:min-h-dvh lg:flex-col lg:px-12 lg:pb-10 lg:pt-14`}
        >
          {/* Depth gradients */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse at top left, rgba(255,255,255,0.28) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(0,0,0,0.16) 0%, transparent 60%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-20 h-32 w-32 rounded-full bg-white/15 blur-3xl"
          />

          {/* Top bar */}
          {(BackEl || tenantName) && (
            <div className="flex items-center justify-between gap-2">
              {BackEl}
              {tenantName && (
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-85">
                  {tenantName}
                </span>
              )}
            </div>
          )}

          {/* Hero body — centered on desktop, stacked on mobile */}
          <div className="mt-6 lg:mt-auto lg:flex lg:flex-1 lg:flex-col lg:justify-center">
            {hero}
          </div>
        </section>

        {/* ── Body pane ── */}
        <section
          className={`relative -mt-8 flex flex-col rounded-t-[28px] bg-surface px-5 pb-8 pt-6 shadow-2xl lg:mt-0 lg:rounded-none lg:px-12 lg:pb-12 lg:pt-14 lg:shadow-none`}
        >
          {!hideGrabber && (
            <div className="mb-3 flex justify-center lg:hidden">
              <div
                className="h-1 w-12 rounded-full bg-muted-foreground/25"
                aria-hidden
              />
            </div>
          )}

          <div className="mx-auto w-full max-w-md lg:max-w-md">{children}</div>
        </section>
      </div>
    </main>
  );
}
