"use client";

import { Search, X } from "lucide-react";

interface MenuSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  filteredCount: number;
  placeholder?: string;
}

/**
 * Search bar above the menu grid. Shown only when the tenant has enough
 * products to make scanning a list hard (caller decides the threshold).
 */
export function MenuSearchBar({
  value,
  onChange,
  totalCount,
  filteredCount,
  placeholder = "Buscar producto...",
}: MenuSearchBarProps) {
  const hasFilter = value.trim().length > 0;

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-2xl border-2 border-border bg-background py-3 pl-10 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
        />
        {hasFilter && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-border-soft/60 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {hasFilter && (
        <p className="px-1 text-[11px] text-muted-foreground">
          {filteredCount === 0
            ? "Sin resultados"
            : `${filteredCount} de ${totalCount} productos`}
        </p>
      )}
    </div>
  );
}
