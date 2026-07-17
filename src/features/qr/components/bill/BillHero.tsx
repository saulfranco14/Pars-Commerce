"use client";

import Image from "next/image";
import { CheckCircle2, Receipt } from "lucide-react";

import { formatCurrency, getInitials } from "@/features/qr/helpers/format";

interface BillHeroProps {
  tableLabel?: string | null;
  tenantName?: string | null;
  tenantLogoUrl?: string | null;
  total: number;
  paidTotal: number;
  balanceDue: number;
  isPaid: boolean;
}

/**
 * Compact header for the bill, rendered inside <CustomerScreen>. The total is
 * the protagonist (DESIGN_SYSTEM.md §1). Monochrome — the only status color is
 * driven by the screen tone (emerald when paid), never mixed accents.
 */
export function BillHero({
  tableLabel,
  tenantName,
  tenantLogoUrl,
  total,
  paidTotal,
  balanceDue,
  isPaid,
}: BillHeroProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/90 p-1">
          {tenantLogoUrl ? (
            <Image
              src={tenantLogoUrl}
              alt={tenantName ?? "Negocio"}
              fill
              sizes="40px"
              className="object-contain"
            />
          ) : tenantName ? (
            <span className="text-sm font-bold uppercase tracking-tight text-accent">
              {getInitials(tenantName)}
            </span>
          ) : (
            <Receipt className="h-5 w-5 text-accent" />
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
            Tu cuenta
          </p>
          {tableLabel && (
            <p className="truncate text-lg font-bold tracking-tight">
              {tableLabel}
            </p>
          )}
        </div>
        {isPaid && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
            <CheckCircle2 className="h-3 w-3" />
            Pagada
          </span>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
          {isPaid ? "Total pagado" : "Total"}
        </p>
        <p className="mt-0.5 text-5xl font-bold tracking-tight">
          {formatCurrency(total)}
        </p>
      </div>

      {!isPaid && (paidTotal > 0 || balanceDue > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {paidTotal > 0 && (
            <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Pagado
              </p>
              <p className="text-sm font-bold">{formatCurrency(paidTotal)}</p>
            </div>
          )}
          {balanceDue > 0 && (
            <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Por pagar
              </p>
              <p className="text-sm font-bold">{formatCurrency(balanceDue)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
