/**
 * ¿Hay que esperar a que el pedido esté listo antes de poder cobrarlo?
 *
 * En una mesa sí: el cliente pide, le llega, y paga al final — cobrar antes de
 * servir es cobrar por algo que todavía no vio.
 *
 * En autoservicio, mostrador y ecommerce es al revés: el cliente pide, paga y
 * después el negocio prepara y entrega. Ahí `paid` abre la postventa; no cierra
 * la operación.
 *
 * El origen desconocido (`null`, pedidos viejos) se trata como mesa: es la regla
 * más estricta y no afloja nada de lo que ya estaba en producción.
 */
const PAY_BEFORE_FULFILLMENT: ReadonlySet<string> = new Set([
  "kiosk",
  "staff",
  // En ecommerce el pago abre la postventa: preparar, marcar listo y después
  // entregar o confirmar la recolección. `paid` no significa trabajo cerrado.
  "public_store",
]);

/** Estaba copiado en tres servicios; se lee igual en los tres. */
export const NOT_READY_MESSAGE =
  "El negocio aún está preparando tu pedido. Podrás pagar cuando esté listo.";

export function requiresReadyBeforePayment(
  source: string | null | undefined,
  orderType?: string | null,
): boolean {
  // Source is immutable audit data; once a kiosk customer deliberately sits at
  // a table, the service context becomes dine-in and follows table payment
  // rules even though the order still originated at a kiosk.
  if (orderType === "dine_in") return true;
  return !PAY_BEFORE_FULFILLMENT.has((source ?? "").trim());
}
