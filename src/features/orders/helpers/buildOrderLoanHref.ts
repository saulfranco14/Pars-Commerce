import type { OrderDetail } from "@/features/orders/interfaces/orderDetail";

/** Construye la navegación al préstamo sin acoplarla al componente visual. */
export function buildOrderLoanHref(
  tenantSlug: string,
  order: OrderDetail,
): string {
  const concept =
    order.items
      ?.map((item) => item.product?.name)
      .filter(Boolean)
      .join(", ") || `Orden ${order.id.slice(0, 8)}`;
  const params = new URLSearchParams({
    order_id: order.id,
    amount: String(order.total),
    concept,
  });

  return `/dashboard/${tenantSlug}/prestamos/nuevo?${params.toString()}`;
}
