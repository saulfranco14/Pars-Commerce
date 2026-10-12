export type CommerceFulfillmentActionKind =
  | "add_evidence"
  | "start_preparation"
  | "mark_ready"
  | "start_delivery"
  | "confirm_delivery"
  | "complete_pickup";

export const COMMERCE_FULFILLMENT_COPY: Record<
  CommerceFulfillmentActionKind,
  { title: string; description: string }
> = {
  add_evidence: {
    title: "Pedido entregado",
    description: "Agrega la fotografía para dejar evidencia visible al cliente.",
  },
  start_preparation: {
    title: "Pedido pagado",
    description: "Comienza la preparación para mantener informado al cliente.",
  },
  mark_ready: {
    title: "En preparación",
    description: "Confirma cuando el pedido esté listo para salir o recogerse.",
  },
  start_delivery: {
    title: "Listo para entregar",
    description: "Marca la salida cuando el paquete vaya en camino.",
  },
  confirm_delivery: {
    title: "Pedido en camino",
    description: "Al entregarlo, toma una foto para cerrar la orden.",
  },
  complete_pickup: {
    title: "Listo para recoger",
    description: "Confirma cuando el cliente ya se llevó su pedido.",
  },
};
