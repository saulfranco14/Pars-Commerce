/**
 * Every permission a tenant role can hold, in one place. The role editor, the
 * roles API validator, `describeRole()` and `dashboardAccess` all read this
 * list; a permission seeded in SQL but missing here can't be granted or shown.
 */

export type PermissionGroup =
  | "orders"
  | "operations"
  | "money"
  | "sales"
  | "catalog"
  | "qr"
  | "business";

export interface PermissionDefinition {
  key: string;
  group: PermissionGroup;
  /** Toggle label in the role editor. */
  label: string;
  /** Fragment for `describeRole()`: "Podrá {phrase}, …". Omitted = not described. */
  phrase?: string;
  /** Granting this one grants these too (e.g. distributing work needs seeing all of it). */
  requires?: string[];
  /** Legacy keys kept for compatibility; never offered in the editor. */
  legacy?: boolean;
}

export const PERMISSION_GROUP_LABELS: Record<PermissionGroup, string> = {
  orders: "Pedidos",
  operations: "Operación",
  money: "Dinero",
  sales: "Ventas y clientes",
  catalog: "Catálogo",
  qr: "QR y mesas",
  business: "Negocio",
};

// Array order matters for `describeRole()`: daily work first, admin last.
export const PERMISSION_CATALOG: PermissionDefinition[] = [
  { key: "order.take", group: "orders", label: "Levantar pedidos", phrase: "levantar pedidos" },
  { key: "orders.read", group: "orders", label: "Consultar pedidos" },
  { key: "orders.view_all", group: "orders", label: "Ver todos los pedidos", phrase: "ver todos los pedidos del negocio", requires: ["orders.read"] },
  { key: "orders.view_assigned", group: "orders", label: "Ver los pedidos asignados", phrase: "ver los pedidos que tenga asignados", requires: ["orders.read"] },
  { key: "orders.write", group: "orders", label: "Editar pedidos", phrase: "editar pedidos", requires: ["orders.read"] },
  { key: "orders.assign", group: "orders", label: "Repartir el trabajo", phrase: "repartir pedidos entre el equipo", requires: ["orders.view_all"] },
  { key: "orders.close", group: "orders", label: "Cerrar o cancelar pedidos", phrase: "cerrar o cancelar pedidos", requires: ["orders.read"] },
  { key: "orders.addendum", group: "orders", label: "Agregar a pedidos pagados", phrase: "agregar productos a un pedido ya pagado", requires: ["orders.read"] },
  { key: "orders.schedule_config", group: "orders", label: "Abrir y cerrar pedidos agendados", phrase: "abrir y cerrar la recepción de pedidos" },

  { key: "orders.prepare", group: "operations", label: "Preparar pedidos", phrase: "avanzar la preparación (recibido → listo)", requires: ["orders.read"] },
  { key: "orders.deliver", group: "operations", label: "Entregar pedidos", phrase: "entregar pedidos y registrar la entrega", requires: ["orders.read"] },
  { key: "qr.fulfill", group: "operations", label: "Preparar (anterior)", legacy: true },

  { key: "payments.write", group: "money", label: "Cobrar", phrase: "cobrar" },
  { key: "money.read", group: "money", label: "Ver ingresos y liquidaciones", phrase: "ver los ingresos y las liquidaciones" },

  { key: "sales.read", group: "sales", label: "Consultar ventas, clientes y créditos" },
  { key: "sales.write", group: "sales", label: "Registrar ventas", phrase: "registrar ventas", requires: ["sales.read"] },
  { key: "sales.view_all", group: "sales", label: "Ver todas las ventas", requires: ["sales.read"] },
  { key: "sales.view_assigned", group: "sales", label: "Ver sus ventas", requires: ["sales.read"] },
  { key: "sales.assign", group: "sales", label: "Asignar ventas", requires: ["sales.view_all"] },
  { key: "sales.update_assigned", group: "sales", label: "Editar sus ventas", requires: ["sales.read"] },
  { key: "reports.read", group: "sales", label: "Ver reportes" },

  { key: "products.read", group: "catalog", label: "Consultar productos" },
  { key: "products.write", group: "catalog", label: "Administrar productos", phrase: "administrar productos", requires: ["products.read"] },
  { key: "inventory.read", group: "catalog", label: "Consultar inventario" },
  { key: "inventory.write", group: "catalog", label: "Mover inventario", phrase: "mover inventario", requires: ["inventory.read"] },
  { key: "promotions.read", group: "catalog", label: "Consultar promociones" },
  { key: "promotions.write", group: "catalog", label: "Crear promociones", phrase: "crear promociones", requires: ["promotions.read"] },

  { key: "qr.read", group: "qr", label: "Ver mesas y QR" },
  { key: "qr.write", group: "qr", label: "Crear y configurar QR", phrase: "crear y configurar códigos QR", requires: ["qr.read"] },
  { key: "devices.manage", group: "qr", label: "Administrar kioscos y dispositivos", phrase: "administrar kioscos y dispositivos" },

  { key: "team.read", group: "business", label: "Ver el equipo" },
  { key: "team.write", group: "business", label: "Administrar el equipo", phrase: "administrar el equipo", requires: ["team.read"] },
  { key: "settings.read", group: "business", label: "Ver la configuración" },
  { key: "settings.write", group: "business", label: "Cambiar la configuración", phrase: "cambiar la configuración del negocio", requires: ["settings.read"] },
];

/**
 * A legacy key still satisfies the permissions that replaced it, so roles
 * seeded before the split keep working until the migration backfills them.
 */
export const PERMISSION_ALIASES: Record<string, readonly string[]> = {
  "orders.prepare": ["qr.fulfill"],
  "orders.deliver": ["qr.fulfill"],
};

export const KNOWN_PERMISSIONS: ReadonlySet<string> = new Set(
  PERMISSION_CATALOG.map((p) => p.key),
);

/** Adds every permission the given ones depend on, transitively. */
export function withRequiredPermissions(permissions: readonly string[]): string[] {
  const byKey = new Map(PERMISSION_CATALOG.map((p) => [p.key, p]));
  const result = new Set<string>();
  const visit = (key: string) => {
    if (result.has(key)) return;
    result.add(key);
    for (const dep of byKey.get(key)?.requires ?? []) visit(dep);
  };
  permissions.forEach(visit);
  return [...result];
}
