import type { TableOrderItem } from "@/features/qr/interfaces/tableOrder";

interface SplitItemsAssignerProps {
  items: TableOrderItem[];
}

export function SplitItemsAssigner({ items }: SplitItemsAssignerProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-foreground">Asignar items</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Selecciona a qué cuenta pertenece cada item.
      </p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-border px-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span>{item.quantity}x item</span>
              <span>${Number(item.subtotal).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
