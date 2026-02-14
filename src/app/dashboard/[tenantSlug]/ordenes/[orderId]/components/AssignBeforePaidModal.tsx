"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Banknote, Building2, CreditCard, Smartphone, Check, X, DollarSign } from "lucide-react";
import type { TeamMemberOption } from "../types";

const PAYMENT_METHODS = [
  { id: "efectivo", label: "EFECTIVO", icon: Banknote, colorClass: "text-emerald-600" },
  { id: "transferencia", label: "TRANSFERENCIA", icon: Building2, colorClass: "text-violet-600" },
  { id: "tarjeta", label: "TARJETA", icon: CreditCard, colorClass: "text-blue-600" },
  { id: "mercadopago", label: "MERCADO PAGO", icon: Smartphone, colorClass: "text-blue-600" },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

interface AssignBeforePaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assignToId: string, paymentMethod: string) => Promise<void>;
  team: TeamMemberOption[];
  loading?: boolean;
}

export function AssignBeforePaidModal({
  isOpen,
  onClose,
  onConfirm,
  team,
  loading = false,
}: AssignBeforePaidModalProps) {
  const [assignTo, setAssignTo] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("efectivo");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setAssignTo("");
    setPaymentMethod("efectivo");
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, [isOpen]);

  const isCurrentUserInTeam = currentUserId && team.some((t) => t.user_id === currentUserId);

  function handleAssignToMe() {
    if (currentUserId) setAssignTo(currentUserId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTo || loading) return;
    await onConfirm(assignTo, paymentMethod);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-before-paid-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border-soft bg-surface-raised p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3
              id="assign-before-paid-title"
              className="text-lg font-semibold text-foreground"
            >
              Asignar antes de marcar como pagada
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Esta orden no tiene un encargado. Selecciona quién se encargará
              para registrar la venta en comisiones.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="assign-select"
              className="block text-xs font-medium uppercase tracking-wide text-muted"
            >
              Encargado
            </label>
            <div className="mt-1.5 flex gap-2">
              <select
                id="assign-select"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="select-custom min-h-[40px] flex-1 rounded-lg border border-border bg-border-soft/50 px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              >
                <option value="">Seleccionar...</option>
                {team.map((t) => (
                  <option key={t.user_id} value={t.user_id}>
                    {t.display_name || t.email}
                  </option>
                ))}
              </select>
              {isCurrentUserInTeam && (
                <button
                  type="button"
                  onClick={handleAssignToMe}
                  className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
                >
                  <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                  Asignar a mí
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted">
              Método de pago
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(({ id, label, icon: Icon, colorClass }) => {
                const isSelected = paymentMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={`relative flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border bg-surface hover:bg-border-soft/50"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute right-2 top-2 text-accent" aria-hidden>
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                    <Icon className={`h-5 w-5 shrink-0 ${colorClass}`} aria-hidden />
                    <span className={`text-xs font-medium ${isSelected ? "text-accent" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
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
              type="submit"
              disabled={loading || !assignTo}
              className="inline-flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <DollarSign className="h-4 w-4 shrink-0" aria-hidden />
              {loading ? "Guardando…" : "Asignar y cobrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
