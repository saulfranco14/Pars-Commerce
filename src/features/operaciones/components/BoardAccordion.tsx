"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { BoardAccordionProps } from "@/features/operaciones/interfaces/boardComponents";

// One column on phones; side by side on desktop so every group stays in sight.
const DESKTOP_COLUMNS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-2 2xl:grid-cols-4",
};

/** Foldable groups: one column on phones, one per group on desktop. */
export function BoardAccordion({ columns, renderOrder }: BoardAccordionProps) {
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  // Groups with work start open; an empty one starts closed.
  const isOpen = (key: string, count: number) => toggled[key] ?? count > 0;

  return (
    <div className={`grid grid-cols-1 items-start gap-3 ${DESKTOP_COLUMNS[columns.length] ?? ""}`}>
      {columns.map((column) => {
        const open = isOpen(column.key, column.orders.length);
        return (
          <section key={column.key} className="min-w-0 rounded-2xl border border-border bg-surface-raised">
            <button
              type="button"
              onClick={() => setToggled((t) => ({ ...t, [column.key]: !open }))}
              aria-expanded={open}
              className="flex min-h-13 w-full cursor-pointer items-center justify-between gap-3 px-4 text-left"
            >
              <span className="text-sm font-bold text-foreground">{column.label}</span>
              <span className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                    column.orders.length > 0 ? "bg-accent text-accent-foreground" : "bg-border-soft text-muted-foreground"
                  }`}
                >
                  {column.orders.length}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
              </span>
            </button>
            {open && (
              <div className="space-y-2 border-t border-border-soft p-3">
                {column.orders.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-muted-foreground">{column.empty}</p>
                ) : (
                  column.orders.map((order) => renderOrder(order))
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
