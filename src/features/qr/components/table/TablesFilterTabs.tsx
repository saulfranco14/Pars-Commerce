"use client";

import { FilterTabs } from "@/components/ui/FilterTabs";

import type { TableFilter } from "@/features/qr/hooks/useTablesList";

interface TablesFilterTabsProps {
  filter: TableFilter;
  onChange: (filter: TableFilter) => void;
  counts: { total: number; free: number; occupied: number };
}

/**
 * Table filter tabs. Uses the shared FilterTabs (the dashboard-wide filter
 * style — rectangular, accent when active) with the count folded into each
 * label, since FilterTabs has no count-badge slot.
 */
export function TablesFilterTabs({
  filter,
  onChange,
  counts,
}: TablesFilterTabsProps) {
  return (
    <FilterTabs
      ariaLabel="Filtrar mesas"
      activeValue={filter}
      onTabChange={(v) => onChange(v as TableFilter)}
      tabs={[
        { value: "all", label: `Todas ${counts.total}` },
        { value: "occupied", label: `Ocupadas ${counts.occupied}` },
        { value: "free", label: `Libres ${counts.free}` },
      ]}
    />
  );
}
