"use client";

import Link from "next/link";
import { CreditCard, PlusCircle, Users } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

interface BillActionsSectionProps {
  token: string;
  orderId: string;
  balanceDue: number;
  showPay: boolean;
  showSplit: boolean;
  onPay: () => void;
  showSingleDeviceHint: boolean;
}

export function BillActionsSection({
  token,
  orderId,
  balanceDue,
  showPay,
  showSplit,
  onPay,
  showSingleDeviceHint,
}: BillActionsSectionProps) {
  return (
    <div className="space-y-3">
      {showPay && (
        <button
          type="button"
          onClick={onPay}
          className="inline-flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] transition-transform"
        >
          <CreditCard className="h-5 w-5" />
          Pagar {formatCurrency(balanceDue)}
        </button>
      )}

      <div className={`grid gap-2 ${showSplit ? "grid-cols-2" : "grid-cols-1"}`}>
        <Link
          href={`/q/${token}`}
          className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border-soft/40 transition-colors"
        >
          <PlusCircle className="h-4 w-4 text-muted-foreground" />
          Agregar más
        </Link>
        {showSplit && (
          <Link
            href={`/q/${token}/table/bill?order_id=${orderId}&split=1`}
            className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-accent/40 bg-accent/5 px-4 py-2.5 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
          >
            <Users className="h-4 w-4" />
            Dividir cuenta
          </Link>
        )}
      </div>

      {showSingleDeviceHint && (
        <p className="text-center text-xs text-muted-foreground">
          Comparte el QR con tu acompañante para poder dividir la cuenta.
        </p>
      )}
    </div>
  );
}
