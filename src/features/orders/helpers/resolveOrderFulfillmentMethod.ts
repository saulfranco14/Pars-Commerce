export type OrderFulfillmentMethod = "delivery" | "pickup";

interface FulfillmentEvidence {
  fulfillment_method?: OrderFulfillmentMethod | null;
  scheduled_for?: string | null;
  delivery_details?: {
    address_text?: string | null;
    pickup_point_id?: string | null;
  } | null;
}

/**
 * Resuelve cómo se entregará una orden sin dejar que datos históricos
 * contradictorios conviertan una entrega en recolección.
 *
 * El detalle capturado en checkout es la evidencia más específica: un punto
 * identifica recolección y una dirección sin punto identifica domicilio. El
 * método guardado sigue siendo la fuente normal; `scheduled_for` sólo cubre
 * pedidos antiguos que todavía no tenían `fulfillment_method`.
 */
export function resolveOrderFulfillmentMethod(
  order: FulfillmentEvidence,
): OrderFulfillmentMethod | null {
  const details = order.delivery_details;
  if (details?.pickup_point_id) return "pickup";
  if (details?.address_text?.trim()) return "delivery";
  if (
    order.fulfillment_method === "delivery" ||
    order.fulfillment_method === "pickup"
  ) {
    return order.fulfillment_method;
  }
  return order.scheduled_for ? "pickup" : null;
}

