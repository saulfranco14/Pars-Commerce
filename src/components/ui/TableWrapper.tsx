"use client";

import type { ReactNode } from "react";

interface TableWrapperProps {
  children: ReactNode;
  className?: string;
}

export function TableWrapper({ children, className = "" }: TableWrapperProps) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-surface-raised ${className}`}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export const tableHeaderRowClass =
  "bg-border-soft/60 border-b border-border-soft";
export const tableHeaderCellClass =
  "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted";
export const tableHeaderCellRightClass =
  "px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted";
export const tableBodyRowClass = "divide-y divide-border-soft hover:bg-border-soft/40 transition-colors";
export const tableBodyCellClass = "px-4 py-3 text-sm text-foreground";
export const tableBodyCellMutedClass = "px-4 py-3 text-sm text-muted";
export const tableBodyCellRightClass =
  "px-4 py-3 text-right text-sm font-medium text-foreground";
