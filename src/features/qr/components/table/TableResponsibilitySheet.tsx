"use client";

import { ReceiptText, UserRoundCheck } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";

interface TableResponsibilitySheetProps {
  isOpen: boolean;
  tableLabel: string;
  loading?: boolean;
  error?: string | null;
  onClaim: () => void;
  onDefer: () => void;
}

/**
 * Intent: immediately after a real first order, let a customer voluntarily
 * take account-level responsibility without making individual checkout depend
 * on it. Blue stays reserved for the deliberate primary commitment.
 */
export function TableResponsibilitySheet({
  isOpen,
  tableLabel,
  loading = false,
  error,
  onClaim,
  onDefer,
}: TableResponsibilitySheetProps) {
  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onDefer}
      dismissible={!loading}
      icon={UserRoundCheck}
      title={`¿Llevarás la cuenta de ${tableLabel}?`}
      description="No es obligatorio. Cada persona puede pagar sus propios productos."
      footer={
        <div className="space-y-2">
          <button
            type="button"
            onClick={onClaim}
            disabled={loading}
            className="flex min-h-13.5 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserRoundCheck className="h-5 w-5" />
            {loading ? "Guardando..." : "Sí, llevaré la cuenta"}
          </button>
          <button
            type="button"
            onClick={onDefer}
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/40 disabled:opacity-60"
          >
            Cada quien paga lo suyo
          </button>
        </div>
      }
    >
      <div className="rounded-2xl bg-border-soft/45 p-4">
        <div className="flex gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <ReceiptText className="h-4 w-4" />
          </span>
          <p className="text-sm leading-5 text-muted-foreground">
            Si la llevas, podrás dividir la cuenta, pagar por alguien más o
            gestionar el total. Podrás cambiarlo con el personal después.
          </p>
        </div>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
    </FormSheet>
  );
}
