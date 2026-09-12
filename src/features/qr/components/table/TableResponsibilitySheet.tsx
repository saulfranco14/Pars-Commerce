"use client";

import { ReceiptText, UserRoundCheck } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import {
  btnCustomerPrimary,
  btnCustomerSecondary,
} from "@/components/ui/buttonClasses";

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
            className={`${btnCustomerPrimary} w-full`}
          >
            <UserRoundCheck className="h-5 w-5" />
            {loading ? "Guardando..." : "Sí, llevaré la cuenta"}
          </button>
          <button
            type="button"
            onClick={onDefer}
            disabled={loading}
            className={`${btnCustomerSecondary} min-h-12 w-full text-sm`}
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
