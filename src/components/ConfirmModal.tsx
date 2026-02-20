"use client";

import type { ReactNode } from "react";
import { X, Check, Trash2 } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  confirmDanger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  confirmDanger = true,
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-surface-raised p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="confirm-modal-title"
          className="text-lg font-semibold text-foreground"
        >
          {title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4 shrink-0" aria-hidden />
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={
              confirmDanger
                ? "inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                : "inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            }
          >
            {confirmDanger ? (
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Check className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
