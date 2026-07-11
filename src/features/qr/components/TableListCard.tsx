"use client";

import Link from "next/link";
import { Coffee, QrCode as QrIcon, Users } from "lucide-react";

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

export function TableListCard({
  table,
  tenantSlug,
  onViewQr,
}: TableListCardProps) {
  const occupied = !!table.current_order_id;

  return (
    <AdminListCard
      icon={Coffee}
      title={table.label}
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
            className={adminActionButtonPrimary}
          >
            {occupied ? "Ver actividad" : "Detalle"}
          </Link>
        </>
      }
    />
  );
}
