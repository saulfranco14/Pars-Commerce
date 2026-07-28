/**
 * Qué pedidos pide la lista.
 *
 * `scope` es una PREFERENCIA de quien mira, no una autorización: "todos"
 * significa "todos los que mi rol alcanza a ver". Quien no tiene
 * `orders.view_all` recibe lo mismo con cualquiera de los dos valores, porque
 * el recorte real lo aplica el servidor.
 */
export type OrdersScope = "mine" | "all";

export interface OrdersQuery {
  tenantId: string | undefined;
  status: string;
  dateFrom: string;
  dateTo: string;
  scope: OrdersScope;
}
