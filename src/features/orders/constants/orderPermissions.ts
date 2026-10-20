// Mirrors the role-scoping migrations and `src/constants/permissionCatalog.ts`: a permission added here
// must be seeded there or nobody will ever hold it.
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
  prepare: "orders.prepare",
  deliver: "orders.deliver",
} as const;
