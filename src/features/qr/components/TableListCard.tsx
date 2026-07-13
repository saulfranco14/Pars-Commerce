"use client";

import Link from "next/link";
import { QrCode as QrIcon, Store, Users } from "lucide-react";

import { AdminListCard } from "@/components/admin/AdminListCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface TableListCardProps {
  table: QrCode;
  tenantSlug: string;
  onViewQr: (table: QrCode) => void;
}

/**
 * One table in the list. State (ocupada/libre) already reads at a glance
 * from the badge + colored icon tile + highlighted border — no separate
 * explanatory body line, so with 4+ tables the list stays compact and
 * scannable instead of each card eating an extra row of text.
 */
export function TableListCard({
  table,
  tenantSlug,
  onViewQr,
}: TableListCardProps) {
  const occupied = !!table.current_order_id;

  const thumbnail = (
    <span
      className={`flex h-11 w-11 items-center justify-center rounded-xl ${
        occupied
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700"
      }`}
    >
      <Store className="h-5 w-5" />
    </span>
  );

  return (
    <AdminListCard
      title={table.label}
      thumbnail={thumbnail}
      highlighted={occupied}
      meta={
        table.table_capacity ? (
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" />
            {table.table_capacity} personas
          </span>
        ) : null
      }
      badge={
        <StatusBadge
          tone={occupied ? "warning" : "success"}
          label={occupied ? "Ocupada" : "Libre"}
        />
      }
      actions={
        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            onClick={() => onViewQr(table)}
            className={`flex-1 ${adminActionButtonSecondary}`}
          >
            <QrIcon className="h-3.5 w-3.5" />
            Ver QR
          </button>
          <Link
            href={`/dashboard/${tenantSlug}/mesas/${table.id}`}
            className={`flex-1 ${occupied ? adminActionButtonPrimary : adminActionButtonSecondary}`}
          >
            {occupied ? "Ver actividad" : "Detalle"}
          </Link>
        </div>
      }
    />
  );
}
