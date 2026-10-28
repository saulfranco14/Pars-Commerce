import Image from "next/image";
import { CalendarClock, Package, Plus } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { ParaItem } from "@/features/growth/interfaces/para";

/** Read-only twin of the storefront ProductCard: same tokens and shape, no cart and no product page. */
export function ParaProductCard({ item, priority = false }: { item: ParaItem; priority?: boolean }) {
  const FallbackIcon = item.type === "service" ? CalendarClock : Package;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-(--store-radius) bg-(--store-surface) shadow-sm ring-1 ring-(--store-hairline)">
      <div className="relative aspect-square overflow-hidden bg-(--store-well)">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill priority={priority} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center">
            <FallbackIcon className="h-10 w-10 text-(--store-ink-2) opacity-40" aria-hidden />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3.5 sm:p-4">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-(--store-ink)">{item.name}</h3>
        {item.category ? <p className="line-clamp-1 text-[13px] text-(--store-ink-2)">{item.category}</p> : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <span className="text-lg font-bold tabular-nums text-(--store-ink)">{formatCurrency(item.price)}</span>
          <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Plus className="h-5 w-5" />
          </span>
        </div>
      </div>
    </article>
  );
}
