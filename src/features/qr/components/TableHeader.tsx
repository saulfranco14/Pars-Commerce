"use client";

import { getInitials } from "@/features/qr/helpers/format";

interface TableHeaderProps {
  tenantName: string;
  tableLabel: string;
  deviceName: string;
}

/**
 * Compact header for the in-table menu view: tenant eyebrow, table title,
 * and the customer's avatar chip on the right.
 */
export function TableHeader({
  tenantName,
  tableLabel,
  deviceName,
}: TableHeaderProps) {
  return (
    <header className="mb-5 flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
          {tenantName}
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {tableLabel}
        </h1>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 shadow-sm">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
          {getInitials(deviceName)}
        </span>
        <span className="text-sm font-medium text-foreground">
          {deviceName}
        </span>
      </div>
    </header>
  );
}
