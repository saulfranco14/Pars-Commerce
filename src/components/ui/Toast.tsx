"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle } from "lucide-react";

import type { ReactNode } from "react";

export type ToastTone = "success" | "error";

interface ToastProps {
  message: ReactNode;
  tone?: ToastTone;
  durationMs?: number;
  onDone: () => void;
}

/**
 * App-wide toast. A slim, solid color banner (success = emerald, error = red)
 * that sits ABOVE the fixed bottom CTA bar so it never covers the primary
 * action, and stays inside the centered mobile column (max-w-lg). A thin
 * progress line shows the auto-dismiss countdown. Theme-aware.
 */
export function Toast({
  message,
  tone = "success",
  durationMs = 3000,
  onDone,
}: ToastProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [onDone, durationMs]);

  if (!mounted) return null;

  const Icon = tone === "success" ? CheckCircle2 : XCircle;
  const surface =
    tone === "success"
      ? "bg-emerald-600 text-white"
      : "bg-red-600 text-white";

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      // Centered to the app column; lifted clear of the ~92px fixed CTA bar.
      className="pointer-events-none fixed inset-x-0 z-80 flex justify-center px-4"
      style={{ bottom: "calc(96px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div
        className={`pointer-events-auto w-full max-w-lg overflow-hidden rounded-2xl shadow-lg ${surface}`}
      >
        <div className="flex items-center gap-2.5 px-4 py-3">
          <Icon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          <span className="text-sm font-bold leading-snug">{message}</span>
        </div>
        {/* auto-dismiss progress line */}
        <div className="h-0.5 w-full bg-white/25">
          <div
            className="h-full bg-white/70"
            style={{ animation: `toast-progress ${durationMs}ms linear forwards` }}
          />
        </div>
      </div>
      <style>{`
        @keyframes toast-progress { from { width: 100%; } to { width: 0%; } }
        @media (prefers-reduced-motion: reduce) {
          [style*="toast-progress"] { animation: none !important; width: 100%; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
