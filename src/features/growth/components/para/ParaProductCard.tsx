import Image from "next/image";
import { Plus } from "lucide-react";

import { itemInitials } from "@/features/growth/helpers/paraSender";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { ParaItem } from "@/features/growth/interfaces/para";

/** Read-only twin of the storefront ProductCard: same tokens and shape, no cart and no product page. */
export function ParaProductCard({ item, priority = false }: { item: ParaItem; priority?: boolean }) {
  return (
    <article
      data-para-item={item.name}
      className="flex h-full flex-col overflow-hidden rounded-(--store-radius) bg-(--store-surface) shadow-sm ring-1 ring-(--store-hairline)"
    >
      <div className="relative aspect-square overflow-hidden bg-(--store-well)">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill priority={priority} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px" className="object-cover" />
        ) : (
          <span aria-hidden className="flex h-full items-center justify-center bg-accent/8 text-4xl font-bold tracking-tight text-accent">
            {itemInitials(item.name)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5 sm:p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-(--store-ink)">{item.name}</h3>
        {item.category ? <p className="line-clamp-1 text-[13px] text-(--store-ink-2)">{item.category}</p> : null}
        <p className="mt-auto pt-2 text-xs font-medium text-(--store-ink-2)">Precio de ejemplo</p>
        <div className="flex items-end justify-between gap-2">
          <span className="text-lg font-bold tabular-nums text-(--store-ink)">{formatCurrency(item.price)}</span>
          <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </div>
    </article>
  );
}
