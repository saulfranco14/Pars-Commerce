export type PublicOrderRequestAction =
  | "accept-request"
  | "reject-request";

export type OrderDeliveryEventType =
  | "out_for_delivery"
  | "delivered"
  | "pickup_completed";

async function readApiError(
  response: Response,
  fallback: string,
): Promise<Error> {
  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
  };
  return new Error(result.error ?? fallback);
}

/** Única responsabilidad: aceptar o rechazar una solicitud pública. */
export async function updatePublicOrderRequest(
  orderId: string,
  action: PublicOrderRequestAction,
): Promise<void> {
  const response = await fetch(`/api/orders/${orderId}/${action}`, {
    method: "POST",
    headers:
      action === "reject-request"
        ? { "Content-Type": "application/json" }
        : undefined,
    body:
      action === "reject-request"
        ? JSON.stringify({
            reason: "El negocio no puede atender este pedido por ahora.",
          })
        : undefined,
  });

  if (!response.ok) {
    throw await readApiError(
      response,
      "No pudimos actualizar la solicitud.",
    );
  }
}

/** Única responsabilidad: enviar un evento de entrega a la API. */
export async function createOrderDeliveryEvent(
  orderId: string,
  type: OrderDeliveryEventType,
  photo?: File,
  note?: string,
): Promise<void> {
  const form = new FormData();
  form.set("type", type);
  if (photo) form.set("photo", photo);
  if (note) form.set("note", note);

  const response = await fetch(`/api/orders/${orderId}/delivery-events`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw await readApiError(
      response,
      "No pudimos actualizar el estado de entrega.",
    );
  }
}
