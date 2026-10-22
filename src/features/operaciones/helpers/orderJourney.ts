import type { BoardOrder, JourneyStep } from "@/features/operaciones/interfaces/board";

function startStep(order: BoardOrder): JourneyStep {
  if (order.status === "pending_acceptance") return { key: "start", label: "Pedido", detail: "Por aceptar", state: "now" };
  const detail = order.paysAfterReady ? "Desde la mesa" : order.source === "staff" ? "En mostrador" : "Aceptado";
  return { key: "start", label: "Pedido", detail, state: "done" };
}

function prepStep(order: BoardOrder, accepted: boolean): JourneyStep {
  if (order.fulfillmentStatus === "ready") return { key: "prep", label: "Preparación", detail: "Listo", state: "done" };
  const ready = order.items.filter((i) => i.status === "ready").length;
  if (order.fulfillmentStatus === "in_progress") {
    const detail = order.items.length > 1 ? `${ready} de ${order.items.length} listos` : "En proceso";
    return { key: "prep", label: "Preparación", detail, state: "now" };
  }
  return { key: "prep", label: "Preparación", detail: "Por empezar", state: accepted ? "now" : "todo" };
}

function payStep(order: BoardOrder): JourneyStep {
  if (order.paid) {
    const detail = order.paymentMethod === "mercadopago" ? "Pagado en línea" : "Pagado";
    return { key: "pay", label: "Pago", detail, state: "done" };
  }
  if (order.paymentReview === "proof") return { key: "pay", label: "Pago", detail: "Comprobante por revisar", state: "wait" };
  if (order.paymentReview === "declared") return { key: "pay", label: "Pago", detail: "Pago por confirmar", state: "wait" };
  const ready = order.fulfillmentStatus === "ready";
  if (order.paysAfterReady && !ready) return { key: "pay", label: "Pago", detail: "Al terminar", state: "todo" };
  return { key: "pay", label: "Pago", detail: "Por cobrar en Caja", state: ready ? "now" : "todo" };
}

function deliveryStep(order: BoardOrder): JourneyStep {
  const pickup = order.fulfillmentMethod === "pickup";
  if (order.deliveryStage === "done") return { key: "delivery", label: "Entrega", detail: "Entregado", state: "done" };
  if (order.deliveryStage === "on_the_way") return { key: "delivery", label: "Entrega", detail: "En camino", state: "now" };
  if (order.fulfillmentStatus === "ready" && order.paid) {
    return { key: "delivery", label: "Entrega", detail: pickup ? "Puede recogerlo" : "Por salir", state: "now" };
  }
  return { key: "delivery", label: "Entrega", detail: pickup ? "Recoge en local" : "A domicilio", state: "todo" };
}

/**
 * The order's whole route on one line, so nobody opens another station to know where it is.
 * Steps don't always go in order: an online payment is done before preparation starts.
 */
export function orderJourney(order: BoardOrder): JourneyStep[] {
  const start = startStep(order);
  const steps = [start, prepStep(order, start.state === "done"), payStep(order)];
  // Counter and table orders are handed over in person: no delivery step.
  if (order.fulfillmentMethod) steps.push(deliveryStep(order));
  return steps;
}
