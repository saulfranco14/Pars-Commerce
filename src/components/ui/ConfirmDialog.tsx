"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, type LucideIcon } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  loading?: boolean;
  icon?: LucideIcon;
}

/**
 * Unified confirmation dialog used across the app instead of window.confirm.
 * - Desktop: centered modal
 * - Mobile: bottom sheet sliding from the bottom (consistent with app's
 *   creation/edit forms)
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  loading = false,
  icon: Icon,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, loading]);

  if (!mounted || !isOpen) return null;

  const isDanger = variant === "danger";
  const Header = Icon ?? (isDanger ? AlertTriangle : null);

  const confirmButton = (
    <button
      type="button"
      onClick={async () => {
        if (loading) return;
        await onConfirm();
      }}
      disabled={loading}
      className={`flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl px-4 py-3 text-base font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 md:max-w-[200px]
        ${isDanger
          ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
          : "bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent"}
      `}
    >
      {loading ? "Procesando..." : confirmLabel}
    </button>
  );

  const cancelButton = (
    <button
      type="button"
      onClick={onClose}
      disabled={loading}
      className="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-4 py-3 text-base font-medium text-foreground hover:bg-border-soft/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:max-w-[140px]"
    >
      {cancelLabel}
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/60 md:items-center md:justify-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl border-t border-border-soft bg-surface shadow-lg md:rounded-2xl md:border"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Mobile grabber */}
        <div className="flex justify-center pt-3 md:hidden">
          <div
            className="h-1 w-12 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
        </div>

        <div className="px-5 pb-4 pt-4 md:px-6 md:pt-6">
          <div className="flex items-start gap-3">
            {Header && (
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  isDanger
                    ? "bg-red-100 text-red-600"
                    : "bg-accent/10 text-accent"
                }`}
              >
                <Header className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3
                id="confirm-dialog-title"
                className="text-base font-semibold text-foreground"
              >
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 px-5 pb-4 md:flex-row md:gap-3 md:justify-end md:px-6 md:pb-6 md:pt-2">
          {cancelButton}
          {confirmButton}
        </div>
      </div>
    </div>,
    document.body,
  );
}
