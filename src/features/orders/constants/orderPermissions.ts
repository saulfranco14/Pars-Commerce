/**
 * Permisos de pedidos. Espejo de
 * `supabase/migrations/20260727000001_orders_role_scoping.sql`: si aquí se
 * agrega uno, allá hay que sembrarlo, o el permiso nunca lo tendrá nadie.
 *
 * Se autoriza SIEMPRE por permiso, nunca comparando `role.name === "owner"`:
 * un rol personalizado no entraría en ese `if`, y el mismo nombre puede tener
 * permisos distintos en dos negocios. `requirePermission` ya deja pasar al
 * owner por todos.
 */
export const ORDER_PERMISSIONS = {
  /** Leer pedidos. Qué pedidos, lo deciden `viewAll` / `viewAssigned`. */
  read: "orders.read",
  /** Editar un pedido (ítems, cliente, descuento, estado). */
  write: "orders.write",
  /** Ve todos los pedidos del negocio. */
  viewAll: "orders.view_all",
  /** Ve solo los pedidos asignados a esa persona. */
  viewAssigned: "orders.view_assigned",
  /** Asigna o reasigna un pedido a otro miembro del equipo. */
  assign: "orders.assign",
  /** Cierra o cancela un pedido. */
  close: "orders.close",
  /** Crea la orden ligada a una ya pagada, sin re-ocupar la mesa. */
  addendum: "orders.addendum",
  /** Abre y cierra la recepción de pedidos agendados desde el sitio. */
  scheduleConfig: "orders.schedule_config",
  /** Levanta un pedido nuevo desde el mostrador. */
  take: "order.take",
} as const;
