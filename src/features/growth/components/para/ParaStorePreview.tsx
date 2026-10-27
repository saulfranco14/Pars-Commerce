import Image from "next/image";
import { Package, Wrench } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { ParaItem } from "@/features/growth/interfaces/para";

export function ParaStorePreview({ items }: { items: ParaItem[] }) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <article key={item.name} className="overflow-hidden rounded-2xl border border-border-soft bg-surface shadow-sm">
          <div className="relative aspect-square bg-border-soft/50">
            {item.imageUrl ? (
              <Image src={item.imageUrl} alt={item.name} fill unoptimized sizes="(min-width:640px) 33vw, 50vw" className="object-cover" />
            ) : item.type === "service" ? (
              <Wrench className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/50" aria-hidden />
            ) : (
              <Package className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/50" aria-hidden />
            )}
          </div>
          <div className="grid gap-1 p-3">
            <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{item.name}</h3>
            <p className="text-base font-bold tabular-nums text-foreground">{formatCurrency(item.price)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
