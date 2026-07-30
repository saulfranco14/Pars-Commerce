// Composed from the role's real permissions, not its name, so custom roles get
// a description and it can't drift from what authorization actually does.

export const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  member: "Colaborador",
  cashier: "Responsable de pedidos",
  waiter: "Mesero",
};

export function roleLabel(name: string): string {
  return ROLE_LABELS[name] ?? name;
}

// Array order matters: daily work first, admin last.
const CAPABILITIES: ReadonlyArray<readonly [permission: string, phrase: string]> =
  [
    ["order.take", "levantar pedidos"],
    ["orders.view_all", "ver todos los pedidos del negocio"],
    ["orders.view_assigned", "ver los pedidos que tenga asignados"],
    ["orders.write", "editar pedidos"],
    // No "y" inside a phrase: `joinPhrases` adds the final one.
    ["orders.assign", "repartir pedidos entre el equipo"],
    ["orders.close", "cerrar o cancelar pedidos"],
    ["qr.fulfill", "avanzar la preparación (recibido → listo)"],
    ["orders.addendum", "agregar productos a un pedido ya pagado"],
    ["orders.schedule_config", "abrir y cerrar la recepción de pedidos"],
    ["sales.write", "registrar ventas"],
    ["payments.write", "cobrar"],
    ["products.write", "administrar productos"],
    ["inventory.write", "mover inventario"],
    ["promotions.write", "crear promociones"],
    ["qr.write", "crear y configurar códigos QR"],
    ["team.write", "administrar el equipo"],
    ["settings.write", "cambiar la configuración del negocio"],
  ];

// `view_all` already covers `view_assigned`; naming both reads as a
// contradiction.
const SUPERSEDED: Record<string, string> = {
  "orders.view_all": "orders.view_assigned",
};

function joinPhrases(phrases: string[]): string {
  if (phrases.length <= 1) return phrases[0] ?? "";
  return `${phrases.slice(0, -1).join(", ")} y ${phrases[phrases.length - 1]}`;
}

// `owner` is described apart: listing ~30 permissions informs nobody.
export function describeRole(
  roleName: string,
  permissions: readonly string[],
): string {
  if (roleName === "owner") {
    return "Acceso total al negocio, sin restricciones.";
  }

  const held = new Set(permissions);
  const hidden = new Set(
    permissions.map((p) => SUPERSEDED[p]).filter(Boolean),
  );

  const phrases = CAPABILITIES.filter(
    ([permission]) => held.has(permission) && !hidden.has(permission),
  ).map(([, phrase]) => phrase);

  if (phrases.length === 0) {
    return "Solo podrá consultar. Este rol no tiene permisos de edición.";
  }

  return `Podrá ${joinPhrases(phrases)}.`;
}
