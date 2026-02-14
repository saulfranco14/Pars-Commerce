"use client";

import type { ReactNode } from "react";

interface TableWrapperProps {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}

export function TableWrapper({
  children,
  className = "",
  scrollable = false,
}: TableWrapperProps) {
  const outerClass = scrollable
    ? `flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-raised ${className}`.trim()
    : `overflow-hidden rounded-xl border border-border bg-surface-raised ${className}`;
  const innerClass = scrollable
    ? "min-h-0 flex-1 overflow-auto"
    : "overflow-x-auto";

  return (
    <div className={outerClass}>
      <div className={innerClass}>{children}</div>
    </div>
  );
}

export const tableHeaderRowClass =
  "bg-border-soft/60 border-b border-border-soft";
export const tableHeaderCellClass =
  "sticky top-0 z-10 bg-border-soft/90 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted";
export const tableHeaderCellRightClass =
  "sticky top-0 z-10 bg-border-soft/90 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted";
export const tableBodyRowClass = "divide-y divide-border-soft hover:bg-border-soft/40 transition-colors";
export const tableBodyCellClass = "px-4 py-3 text-sm text-foreground";
export const tableBodyCellMutedClass = "px-4 py-3 text-sm text-muted";
export const tableBodyCellRightClass =
  "px-4 py-3 text-right text-sm font-medium text-foreground";
