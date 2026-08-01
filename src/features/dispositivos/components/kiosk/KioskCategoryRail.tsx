"use client";

import { LayoutGrid } from "lucide-react";

import { BrandImage } from "@/features/qr/components/BrandImage";

import type { KioskCategoryRailProps } from "@/features/dispositivos/interfaces/kioskUi";

/**
 * Navegación por categoría con foto. Una tira de texto no le dice nada a alguien
 * que ve la pantalla por primera vez desde dos metros; la foto sí.
 */
export function KioskCategoryRail({
  categories,
  activeId,
  onSelect,
  counts,
  tenantLogoUrl,
  tenantName,
}: KioskCategoryRailProps) {
  const cardBase =
    "flex shrink-0 cursor-pointer items-center gap-3 rounded-2xl border-2 p-2 pr-5 transition-all active:scale-[0.98]";

  return (
    <div
      className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Categorías"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeId === "all"}
        onClick={() => onSelect("all")}
        className={`${cardBase} ${
          activeId === "all"
            ? "border-accent bg-accent/10 shadow-md shadow-accent/10"
            : "border-border bg-surface hover:border-accent/40"
        }`}
      >
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <LayoutGrid className="h-7 w-7" aria-hidden />
        </span>
        <span className="text-left">
          <span className="block text-lg font-bold leading-tight text-foreground">
            Todo
          </span>
          <span className="block text-sm text-muted-foreground">
            {counts.all} {counts.all === 1 ? "producto" : "productos"}
          </span>
        </span>
      </button>

      {categories.map((category) => {
        const active = activeId === category.id;
        const count = counts[category.id] ?? 0;
        return (
          <button
            key={category.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(category.id)}
            className={`${cardBase} ${
              active
                ? "border-accent bg-accent/10 shadow-md shadow-accent/10"
                : "border-border bg-surface hover:border-accent/40"
            }`}
          >
            <BrandImage
              src={category.imageUrl}
              logoUrl={tenantLogoUrl}
              name={tenantName}
              alt={category.name}
              className="h-16 w-16 shrink-0"
              rounded="rounded-xl"
              sizes="64px"
            />
            <span className="text-left">
              <span className="block max-w-48 truncate text-lg font-bold leading-tight text-foreground">
                {category.name}
              </span>
              <span className="block text-sm text-muted-foreground">
                {count} {count === 1 ? "producto" : "productos"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
