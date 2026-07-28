/**
 * Espejo de `20260727000001_orders_role_scoping.sql`. Si aquí se agrega uno,
 * allá hay que sembrarlo o nadie lo tendrá nunca.
 */
export const ORDER_PERMISSIONS = {
  read: "orders.read",
  write: "orders.write",
  viewAll: "orders.view_all",
  viewAssigned: "orders.view_assigned",
  assign: "orders.assign",
  close: "orders.close",
  addendum: "orders.addendum",
  scheduleConfig: "orders.schedule_config",
  take: "order.take",
} as const;
