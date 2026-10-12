/** Lee compatiblemente la preferencia antigua y la vigente. */
export function isExpressOrderEnabled(settings: unknown): boolean {
  if (!settings || typeof settings !== "object") return false;
  const value = settings as Record<string, unknown>;
  if (value.express_order_enabled !== undefined) {
    return value.express_order_enabled === true;
  }
  return value.express_orders === true;
}
