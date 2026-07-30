/**
 * ¿Hay que esperar a que el pedido esté listo antes de poder cobrarlo?
 *
 * En una mesa sí: el cliente pide, le llega, y paga al final — cobrar antes de
 * servir es cobrar por algo que todavía no vio.
 *
 * En la pantalla de autoservicio y en el mostrador es al revés: el cliente pide,
 * paga, y se va con su número a esperar. Ahí la guarda dejaba el ticket sin
 * forma de cobrarse, porque nadie está atendiendo esa pantalla para marcarlo
 * listo.
 *
 * El origen desconocido (`null`, pedidos viejos) se trata como mesa: es la regla
 * más estricta y no afloja nada de lo que ya estaba en producción.
 */
const PAY_ON_PICKUP: ReadonlySet<string> = new Set(["kiosk", "staff"]);

/** Estaba copiado en tres servicios; se lee igual en los tres. */
export const NOT_READY_MESSAGE =
  "El negocio aún está preparando tu pedido. Podrás pagar cuando esté listo.";

export function requiresReadyBeforePayment(
  source: string | null | undefined,
): boolean {
  return !PAY_ON_PICKUP.has((source ?? "").trim());
}
