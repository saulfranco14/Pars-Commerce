/**
 * Qué podrá hacer una persona con el rol que le estás por dar.
 *
 * Antes era un `Record<nombreDelRol, string>`. El problema: un rol
 * personalizado se quedaba sin descripción, y si alguien editaba los permisos
 * de un rol de sistema el texto seguía diciendo lo de antes. Ahora la frase se
 * compone de los permisos REALES del rol, así que no puede despegarse de lo
 * que la autorización hace de verdad.
 *
 * Solo se nombran los permisos que cambian el trabajo diario de la persona.
 * Los de lectura (`*.read`) se omiten a propósito: listarlos convierte el hint
 * en un párrafo que nadie lee y esconde lo que sí importa.
 */

/** Nombres de los roles de sistema en español, para el selector. */
export const ROLE_LABELS: Record<string, string> = {
  owner: "Propietario",
  member: "Colaborador",
  cashier: "Responsable de pedidos",
  waiter: "Mesero",
};

/** El nombre en español si es un rol de sistema; si no, el nombre tal cual. */
export function roleLabel(name: string): string {
  return ROLE_LABELS[name] ?? name;
}

/**
 * Permiso → capacidad. El orden del array manda: primero lo que la persona
 * hará todo el día, al final lo administrativo.
 */
const CAPABILITIES: ReadonlyArray<readonly [permission: string, phrase: string]> =
  [
    ["order.take", "levantar pedidos"],
    ["orders.view_all", "ver todos los pedidos del negocio"],
    ["orders.view_assigned", "ver los pedidos que tenga asignados"],
    ["orders.write", "editar pedidos"],
    // Sin "y" dentro de las frases: `joinPhrases` ya pone una al final, y dos
    // seguidas ("... y asignar y reasignar pedidos") se leen mal.
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

/**
 * `orders.view_all` ya incluye lo que dice `orders.view_assigned`, así que
 * nombrar los dos produce "ver todos los pedidos y ver los que tenga
 * asignados", que se lee como una contradicción.
 */
const SUPERSEDED: Record<string, string> = {
  "orders.view_all": "orders.view_assigned",
};

/** Une frases en una lista natural: "a, b y c". */
function joinPhrases(phrases: string[]): string {
  if (phrases.length <= 1) return phrases[0] ?? "";
  return `${phrases.slice(0, -1).join(", ")} y ${phrases[phrases.length - 1]}`;
}

/**
 * Frase en español de lo que podrá hacer alguien con estos permisos.
 * El `owner` se describe aparte: enumerarle los casi treinta permisos no
 * informa de nada.
 */
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
