"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { LucideIcon } from "lucide-react";

interface FormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Max width on desktop. Defaults to `max-w-lg`. */
  maxWidth?: "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl";
  /** Disable click-outside-to-close (e.g. while a form is submitting). */
  dismissible?: boolean;
  /**
   * Optional leading icon chip next to the title — the "Nuevo cliente"-style
   * header (icon in a tinted circle, title + description beside it) used by
   * create-record sheets. Omit for the plain title-only header.
   */
  icon?: LucideIcon;
  /**
   * Optional fixed footer (e.g. Guardar/Cancelar) rendered outside the
   * scrollable body — stays pinned at the bottom of the sheet regardless of
   * how long the form is; only `children` scrolls. Omit to keep the legacy
   * behavior where the footer scrolls together with the rest of `children`.
   */
  footer?: React.ReactNode;
}

/**
 * Unified responsive form container used across the dashboard:
 *   - Mobile: bottom sheet with grabber, swipe-down animation feel.
 *   - Desktop: centered modal with backdrop blur.
 *
 * Replaces the historical dual-render pattern of `ModalShell` + `BottomSheet`
 * (which forced every page to render both for responsive behavior).
 * Use this whenever you need a focused form/wizard in a modal context.
 *
 * See DESIGN_SYSTEM.md §4.4 — companion to `ConfirmDialog` but for forms.
 */
export function FormSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
  dismissible = true,
  icon: Icon,
  footer,
}: FormSheetProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && dismissible) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, dismissible]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60 backdrop-blur-sm md:items-center md:justify-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-sheet-title"
      onClick={dismissible ? onClose : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-3xl border-t border-border-soft bg-surface shadow-2xl md:max-h-[88vh] md:rounded-3xl md:border`}
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {/* Mobile grabber */}
        <div className="flex shrink-0 justify-center pt-3 md:hidden">
          <div
            className="h-1 w-12 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
        </div>

        {/* Header — plain title, or the "Nuevo cliente"-style icon chip
            layout when `icon` is passed. */}
        <div className="shrink-0 px-5 pb-3 pt-3 md:px-6 md:pt-6">
          {Icon ? (
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <Icon className="h-5 w-5 text-accent" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id="form-sheet-title"
                  className="text-base font-bold text-foreground md:text-lg"
                >
                  {title}
                </h2>
                {description && (
                  <p className="text-xs text-muted-foreground md:text-sm">
                    {description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              <h2
                id="form-sheet-title"
                className="text-base font-bold text-foreground md:text-lg"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </>
          )}
        </div>

        {/* Body — scrolls when content is long */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 md:px-6 ${
            footer ? "pb-4 md:pb-4" : "pb-5 md:pb-6"
          }`}
        >
          {children}
        </div>

        {/* Fixed footer — stays pinned below the scrollable body. */}
        {footer && (
          <div className="shrink-0 border-t border-border-soft px-5 py-3 md:px-6 md:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
