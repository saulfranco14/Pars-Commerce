"use client";

import { FilterPills } from "@/components/admin/FilterPills";

import type { TableFilter } from "@/features/qr/hooks/useTablesList";

interface TablesFilterTabsProps {
  filter: TableFilter;
  onChange: (filter: TableFilter) => void;
  counts: { total: number; free: number; occupied: number };
}

export function TablesFilterTabs({
  filter,
  onChange,
  counts,
}: TablesFilterTabsProps) {
  return (
    <FilterPills<TableFilter>
      ariaLabel="Filtrar mesas"
      value={filter}
      onChange={onChange}
      filters={[
        { value: "all", label: "Todas", count: counts.total },
        { value: "occupied", label: "Ocupadas", count: counts.occupied },
        { value: "free", label: "Libres", count: counts.free },
      ]}
    />
  );
}
