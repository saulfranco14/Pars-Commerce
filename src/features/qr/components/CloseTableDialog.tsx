"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check } from "lucide-react";

import type { CloseReason } from "@/features/qr/services/tableCloseService";

interface CloseTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    reason: CloseReason;
    reasonDetails?: string;
  }) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const REASONS: Array<{
  value: CloseReason;
  label: string;
  description: string;
}> = [
  {
    value: "customer_left_unpaid",
    label: "Cliente se fue sin pagar",
    description: "Anota para que el dueño revise",
  },
  {
    value: "paid_outside_system",
    label: "Cobré fuera del sistema",
    description: "Recibí el pago aparte (efectivo, otra app, etc.)",
  },
  {
    value: "opened_by_mistake",
    label: "Abrí por error",
    description: "La mesa quedó abierta sin querer",
  },
  {
    value: "other",
    label: "Otro motivo",
    description: "Lo describiré abajo",
  },
];

/**
 * Modal/sheet for the manual close-table action. Forces the staff member to
 * pick a reason so the audit log records WHY a table was closed without a
 * normal payment. Mirrors ConfirmDialog visually but with a dropdown body.
 */
export function CloseTableDialog({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  error,
}: CloseTableDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState<CloseReason>("customer_left_unpaid");
  const [details, setDetails] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (isOpen) {
      setReason("customer_left_unpaid");
      setDetails("");
    }
  }, [isOpen]);

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

  const requiresDetails = reason === "other";
  const canSubmit = !loading && (!requiresDetails || details.trim().length > 0);

  async function handleConfirm() {
    if (!canSubmit) return;
    await onConfirm({
      reason,
      reasonDetails: requiresDetails ? details.trim() : undefined,
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex flex-col justify-end bg-black/60 md:items-center md:justify-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="close-table-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border-t border-border-soft bg-surface shadow-lg md:max-h-none md:rounded-2xl md:border"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex justify-center pt-3 md:hidden">
          <div
            className="h-1 w-12 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
        </div>

        <div className="px-5 pt-4 md:px-6 md:pt-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3
                id="close-table-title"
                className="text-base font-semibold text-foreground"
              >
                Cerrar mesa manualmente
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                La cuenta no se marcará como pagada. Selecciona el motivo para
                que quede registrado.
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 md:px-6">
          <ul className="space-y-2">
            {REASONS.map((r) => {
              const isSelected = reason === r.value;
              return (
                <li key={r.value}>
                  <button
                    type="button"
                    onClick={() => setReason(r.value)}
                    aria-pressed={isSelected}
                    className={`relative flex w-full min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border bg-surface hover:bg-border-soft/40"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {r.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {r.description}
                      </span>
                    </span>
                    {isSelected && (
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground"
                        aria-hidden
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {requiresDetails && (
            <label className="mt-3 block">
              <span className="block text-xs font-semibold text-foreground">
                Describe el motivo
              </span>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Ej. Tuve que cerrar por incidente con el cliente..."
                className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          )}

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border-soft px-5 pb-3 pt-3 md:px-6 md:pb-6 md:pt-4">
          <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground hover:bg-border-soft/60 disabled:cursor-not-allowed disabled:opacity-50 md:max-w-[140px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 md:max-w-[200px]"
            >
              {loading ? "Cerrando..." : "Cerrar mesa"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
