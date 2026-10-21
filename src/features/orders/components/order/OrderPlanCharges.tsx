import { Repeat } from "lucide-react";

import type { OrderPlanCharge } from "@/features/orders/interfaces/orderDetail";

/** Subscription charges of an order: the plan's price lives here, its products as $0 lines. */
export function OrderPlanCharges({ charges }: { charges: OrderPlanCharge[] }) {
  if (charges.length === 0) return null;
  return (
    <ul className="divide-y divide-border/50 border-b border-border">
      {charges.map((charge) => (
        <li key={charge.id} className="flex items-center gap-3 p-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10">
            <Repeat className="h-4 w-4 text-accent" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">{charge.name_snapshot}</span>
            <span className="block text-xs text-muted-foreground">Suscripción · periodo {charge.period_number}</span>
          </span>
          <span className="text-sm font-semibold tabular-nums text-foreground">${Number(charge.amount).toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}
