"use client";

import Link from "next/link";
import { Coffee, QrCode as QrIcon, Users } from "lucide-react";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface TableListCardProps {
  table: QrCode;
  tenantSlug: string;
  onViewQr: (table: QrCode) => void;
}

/**
 * Compact card for the tables list. The list page only orchestrates layout;
 * each card knows how to present itself (status badge, capacity, actions).
 */
export function TableListCard({ table, tenantSlug, onViewQr }: TableListCardProps) {
  const occupied = !!table.current_order_id;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Coffee className="h-4 w-4 text-muted-foreground" />
            <h3 className="truncate text-base font-semibold text-foreground">
              {table.label}
            </h3>
          </div>
          {table.table_capacity ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {table.table_capacity} personas
            </p>
          ) : null}
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            occupied
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {occupied ? "Ocupada" : "Libre"}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onViewQr(table)}
          className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-border-soft/40"
        >
          <QrIcon className="h-3.5 w-3.5" />
          Ver QR
        </button>
        <Link
          href={`/dashboard/${tenantSlug}/mesas/${table.id}`}
          className="inline-flex min-h-[36px] cursor-pointer items-center rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
        >
          {occupied ? "Ver actividad" : "Detalle"}
        </Link>
      </div>
    </article>
  );
}
