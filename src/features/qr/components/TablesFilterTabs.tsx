"use client";

import type { TableFilter } from "@/features/qr/hooks/useTablesList";

interface FilterDef {
  value: TableFilter;
  label: string;
  count: number;
}

interface TablesFilterTabsProps {
  filter: TableFilter;
  onChange: (filter: TableFilter) => void;
  counts: { total: number; free: number; occupied: number };
}

/**
 * Pill-style filter tabs for the tables list. Counts come from the page's
 * `useTablesList().metrics` so this component stays presentational.
 */
export function TablesFilterTabs({
  filter,
  onChange,
  counts,
}: TablesFilterTabsProps) {
  const filters: FilterDef[] = [
    { value: "all", label: "Todas", count: counts.total },
    { value: "occupied", label: "Ocupadas", count: counts.occupied },
    { value: "free", label: "Libres", count: counts.free },
  ];

  return (
    <div role="tablist" aria-label="Filtrar mesas" className="flex flex-wrap gap-2">
      {filters.map((f) => {
        const isActive = filter === f.value;
        return (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(f.value)}
            className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-accent text-accent-foreground"
                : "border border-border bg-surface text-foreground hover:bg-border-soft/40"
            }`}
          >
            {f.label}
            <span
              className={`rounded-full px-1.5 text-xs font-semibold ${
                isActive
                  ? "bg-accent-foreground/20"
                  : "bg-border-soft text-muted-foreground"
              }`}
            >
              {f.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
