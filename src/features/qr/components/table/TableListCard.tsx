"use client";

import { useEffect, useRef, useState } from "react";
import { ClipboardList, QrCode as QrIcon, Store, Users } from "lucide-react";

import { AdminListCard } from "@/components/admin/AdminListCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { ConfettiBurst } from "@/features/qr/components/ConfettiBurst";
import { getFulfillmentStatusMeta } from "@/features/qr/constants/fulfillmentStatusMeta";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { ActiveTableSummary } from "@/app/api/qr/tables/active/route";
import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface TableListCardProps {
  table: QrCode;
  onViewQr: (table: QrCode) => void;
  /** Opens the mesa's detail in a modal, in place — no navigation. */
  onViewDetail: (tableId: string) => void;
  /** Live total + preparation state, when known — from useActiveTables.
   *  Absent while loading or when the table is free. */
  active?: ActiveTableSummary;
}

/**
 * One table in the list. State (ocupada/libre) already reads at a glance
 * from the badge + colored icon tile + highlighted border. When occupied,
 * the running total + preparation state show in the body — the staff
 * shouldn't have to open the detail modal just to see "how much so far"
 * or "is it ready yet".
 */
export function TableListCard({
  table,
  onViewQr,
  onViewDetail,
  active,
}: TableListCardProps) {
  const occupied = !!table.current_order_id;
  const fulfillmentMeta = active
    ? getFulfillmentStatusMeta(active.fulfillment_status)
    : null;

  // One-shot celebration (Uber/Didi-style) when THIS table's order flips to
  // "ready" — mirrors the tracker's own confetti on the customer side.
  const [justReady, setJustReady] = useState(false);
  const prevStatusRef = useRef(active?.fulfillment_status);
  useEffect(() => {
    if (
      active?.fulfillment_status === "ready" &&
      prevStatusRef.current !== "ready"
    ) {
      setJustReady(true);
      const timer = setTimeout(() => setJustReady(false), 1200);
      prevStatusRef.current = active.fulfillment_status;
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = active?.fulfillment_status;
  }, [active?.fulfillment_status]);

  const thumbnail = (
    <span
      className={`relative flex h-11 w-11 items-center justify-center rounded-xl ${
        occupied
          ? "bg-amber-100 text-amber-700"
          : "bg-emerald-100 text-emerald-700"
      }`}
    >
      <Store className="h-5 w-5" />
      {justReady && <ConfettiBurst />}
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
        occupied && active ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-lg font-bold tabular-nums text-foreground">
              {formatCurrency(active.total)}
            </span>
            {fulfillmentMeta && (
              <StatusBadge tone={fulfillmentMeta.tone} label={fulfillmentMeta.label} />
            )}
          </div>
        ) : null
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
          <button
            type="button"
            onClick={() => onViewDetail(table.id)}
            className={`flex-1 ${adminActionButtonPrimary}`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            {occupied ? "Ver actividad" : "Detalle"}
          </button>
        </div>
      }
    />
  );
}
