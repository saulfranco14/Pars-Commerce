/**
 * Default permissions of the system roles, exactly as `handle_new_tenant()`
 * seeds them (migration 20261019230000). "Restablecer" in the role editor
 * goes back to these; change both together.
 */
export const SYSTEM_ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  member: ["sales.read", "sales.write", "sales.view_all", "sales.view_assigned", "sales.assign", "sales.update_assigned", "products.read", "products.write", "inventory.read", "inventory.write", "promotions.read", "promotions.write", "reports.read", "team.read", "orders.read", "orders.write", "orders.view_assigned", "order.take"],
  cashier: ["sales.read", "sales.write", "sales.view_all", "sales.view_assigned", "orders.read", "orders.write", "orders.view_all", "orders.view_assigned", "orders.assign", "orders.close", "payments.write", "qr.read", "order.take"],
  waiter: ["orders.read", "orders.write", "orders.view_assigned", "orders.prepare", "orders.deliver", "qr.read", "qr.fulfill", "order.take"],
  preparer: ["orders.read", "orders.view_assigned", "orders.prepare"],
  courier: ["orders.read", "orders.view_assigned", "orders.deliver"],
};
