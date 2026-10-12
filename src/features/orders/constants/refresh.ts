/**
 * Cada cuánto se refrescan las vistas de pedidos.
 *
 * El proveedor de SWR tiene `revalidateOnFocus: false` para toda la app, así que
 * estas pantallas no se enteraban de nada hasta que alguien recargaba. Y aquí sí
 * pasan cosas solas: la pantalla de autoservicio levanta pedidos sin que nadie
 * los teclee, y el cliente declara su pago desde su celular.
 */
export const ORDERS_LIST_REFRESH_MS = 15_000;

/**
 * El detalle sólo consulta mientras espera una acción externa (por ejemplo,
 * que el cliente suba un comprobante). Las acciones del personal actualizan
 * el caché de forma explícita, por lo que no necesitan polling constante.
 */
export const ORDER_DETAIL_REFRESH_MS = 30_000;

/** La agenda mira horas, no minutos. */
export const AGENDA_REFRESH_MS = 30_000;
