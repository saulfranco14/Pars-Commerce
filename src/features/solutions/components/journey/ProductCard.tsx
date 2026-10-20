import Image from "next/image";
import { Minus, Plus } from "lucide-react";

import { formatPeso } from "@/features/solutions/helpers/solutionFormat";

import type { CatalogItemDefinition } from "@/features/catalog/catalogDefinitions";

export function ProductCard({
  item,
  fallback,
  quantity,
  onChange,
}: {
  item: CatalogItemDefinition;
  fallback: string;
  quantity: number;
  onChange: (delta: number) => void;
}) {
  const imageSource =
    item.imageUrl && !item.imageUrl.includes("starter-product.svg") ? item.imageUrl : fallback;

  return (
    <article className="grid min-w-0 grid-cols-[96px_1fr] overflow-hidden rounded-2xl border border-border bg-surface shadow-card sm:block">
      <div className="relative min-h-28 bg-border-soft sm:aspect-video sm:min-h-0">
        <Image src={imageSource} alt={item.imageAlt ?? item.name} fill sizes="220px" className="object-cover" />
        {item.category && (
          <span className="absolute left-2 top-2 rounded-full bg-surface/95 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-card">
            {item.category}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-col justify-between p-3">
        <p className="line-clamp-2 text-sm font-semibold text-foreground">{item.name}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-foreground">{formatPeso(item.price)}</span>
          {quantity > 0 ? (
            <div className="flex items-center rounded-xl bg-border-soft dark:bg-border">
              <button type="button" onClick={() => onChange(-1)} aria-label={`Quitar ${item.name}`} className="flex h-10 w-10 cursor-pointer items-center justify-center text-foreground">
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="min-w-4 text-center text-sm font-semibold text-foreground">{quantity}</span>
              <button type="button" onClick={() => onChange(1)} aria-label={`Agregar otro ${item.name}`} className="flex h-10 w-10 cursor-pointer items-center justify-center text-foreground">
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => onChange(1)} aria-label={`Agregar ${item.name}`} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl bg-accent text-accent-foreground hover:bg-accent-hover">
              <Plus className="h-5 w-5" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
