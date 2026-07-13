"use client";

import Link from "next/link";
import { Clock, QrCode as QrIcon, Store, Users } from "lucide-react";

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
 * One table in the list. State (ocupada/libre) is carried by BOTH a badge and
 * a colored icon tile so it reads at a glance — plus a one-line body so the
 * card isn't just a title + two buttons. Occupied tables are highlighted.
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
      body={
        occupied ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <Clock className="h-3.5 w-3.5" />
            Pedido en curso — toca Ver actividad
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Lista para recibir clientes. Comparte su QR para que ordenen.
          </span>
        )
      }
      actions={
        <>
          <button
            type="button"
            onClick={() => onViewQr(table)}
            className={adminActionButtonSecondary}
          >
            <QrIcon className="h-3.5 w-3.5" />
            Ver QR
          </button>
          <Link
            href={`/dashboard/${tenantSlug}/mesas/${table.id}`}
            className={`${adminActionButtonPrimary} ml-auto`}
          >
            {occupied ? "Ver actividad" : "Detalle"}
          </Link>
        </>
      }
    />
  );
}
