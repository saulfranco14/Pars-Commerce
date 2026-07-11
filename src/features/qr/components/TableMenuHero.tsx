"use client";

import { formatCurrency, getInitials } from "@/features/qr/helpers/format";

interface TableMenuHeroProps {
  tableLabel: string;
  deviceName: string;
  tenantLogoUrl?: string | null;
  tenantName?: string | null;
  /** Live cart total (items staged but not yet sent). */
  cartTotal: number;
  /** Number of items staged in the cart. */
  cartItemCount: number;
}

/**
 * Compact header for the in-table menu, rendered inside <CustomerScreen>.
 * The amount is the protagonist (DESIGN_SYSTEM.md §1): shows the live cart
 * total once the customer stages items. Flat, monochrome — no colored icons.
 */
export function TableMenuHero({
  tableLabel,
  deviceName,
  tenantLogoUrl,
  tenantName,
  cartTotal,
  cartItemCount,
}: TableMenuHeroProps) {
  const hasItems = cartItemCount > 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/90">
            {tenantLogoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={tenantLogoUrl}
                alt={tenantName ?? tableLabel}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <span className="text-sm font-bold uppercase tracking-tight text-accent">
                {getInitials(tenantName?.trim() || tableLabel)}
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
              Tu mesa
            </p>
            <p className="truncate text-lg font-bold tracking-tight">
              {tableLabel}
            </p>
          </div>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">
            {getInitials(deviceName)}
          </span>
          <span className="max-w-[80px] truncate text-xs font-semibold">
            {deviceName}
          </span>
        </span>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
          {hasItems
            ? `Tu pedido · ${cartItemCount} ${cartItemCount === 1 ? "producto" : "productos"}`
            : "Arma tu pedido"}
        </p>
        <p className="mt-0.5 text-4xl font-bold tracking-tight">
          {hasItems ? formatCurrency(cartTotal) : "¿Qué vas a pedir?"}
        </p>
      </div>
    </div>
  );
}
