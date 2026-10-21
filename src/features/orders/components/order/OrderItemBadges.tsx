import { Repeat, Tag } from "lucide-react";

import type { OrderItem } from "@/features/orders/interfaces/orderDetail";

const PILL = "inline-flex max-w-full items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium";

export function OrderItemBadges({ item }: { item: OrderItem }) {
  return (
    <>
      {item.is_wholesale && <span className={`${PILL} bg-emerald-500/10 text-emerald-700`}>Mayoreo</span>}
      {item.line_kind === "plan_component" && (
        <span className={`${PILL} bg-accent/10 text-accent`}>
          <Repeat className="h-3 w-3 shrink-0" aria-hidden />
          Incluido en el plan
        </span>
      )}
      {item.promotion && (
        <span className={`${PILL} bg-amber-500/10 text-amber-800 dark:text-amber-300`} title={item.offer_group_id ? "Vendido en paquete" : undefined}>
          <Tag className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate">{item.promotion.name}</span>
        </span>
      )}
    </>
  );
}

