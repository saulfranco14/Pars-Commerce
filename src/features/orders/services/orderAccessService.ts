/**
 * Autorización de pedidos: quién puede ver, asignar y cerrar.
 *
 * Vive aquí y no dentro del route handler porque la misma decisión la toman el
 * GET, el PATCH y el POST de `/api/orders`, y porque hasta ahora estaba
 * copiada dos veces en el PATCH como `role.name === "owner"` — comparar el
 * nombre del rol rompe con roles personalizados y miente en cuanto alguien
 * edita los permisos de un rol de sistema.
 *
 * Ojo con lo que NO hace: la RLS de `orders` solo comprueba membresía, así que
 * el aislamiento entre negocios ya está cubierto por la base. Lo que falta, y
 * lo que resuelve este módulo, es el alcance DENTRO de un mismo negocio.
 */

import { requirePermission } from "@/lib/auth/requirePermission";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";

import type {
  ServiceError,
  ServiceResult,
} from "@/features/qr/services/tablePaymentService";

export interface OrderAccess {
  userId: string;
  membershipId: string;
  roleName: string;
  /** Ve todos los pedidos del negocio, no solo los suyos. */
  canViewAll: boolean;
  /** Edita un pedido. Un rol puede tener `read` sin `write`. */
  canWrite: boolean;
  /** Asigna o reasigna un pedido a otro miembro. */
  canAssign: boolean;
  /** Cierra o cancela un pedido. */
  canClose: boolean;
  /**
   * Puede tocar un pedido YA PAGADO. Reasignar uno pagado reescribe a quién se
   * le atribuye la venta, así que se pide el mismo permiso que para la orden
   * ligada: ambas cosas son "modificar algo que el cliente ya cerró".
   */
  canTouchPaid: boolean;
}

const FORBIDDEN: ServiceError = {
  code: "forbidden",
  message: "No tienes permiso para ver los pedidos de este negocio.",
};

/**
 * Resuelve el alcance del usuario sobre los pedidos de un negocio. Devuelve
 * `forbidden` si no es miembro o si su rol no tiene `orders.read`.
 */
export async function resolveOrderAccess(
  userId: string,
  tenantId: string,
): Promise<ServiceResult<OrderAccess>> {
  const membership = await requirePermission(
    userId,
    tenantId,
    ORDER_PERMISSIONS.read,
  );
  if (!membership) return { ok: false, error: FORBIDDEN };

  // `requirePermission` ya deja pasar al owner aunque le falte el permiso en
  // el array; se repite el criterio aquí para que los flags derivados sigan
  // esa misma regla y no dependan de que la migración le sembrara todo.
  const isOwner = membership.roleName === "owner";
  const has = (permission: string) =>
    isOwner || membership.permissions.includes(permission);

  return {
    ok: true,
    data: {
      userId,
      membershipId: membership.membershipId,
      roleName: membership.roleName,
      canViewAll: has(ORDER_PERMISSIONS.viewAll),
      canWrite: has(ORDER_PERMISSIONS.write),
      canAssign: has(ORDER_PERMISSIONS.assign),
      canClose: has(ORDER_PERMISSIONS.close),
      canTouchPaid: has(ORDER_PERMISSIONS.addendum),
    },
  };
}

/**
 * Si un pedido concreto entra en el alcance del usuario.
 *
 * "Suyo" incluye `created_by` y no solo `assigned_to`: quien levanta un pedido
 * en el mostrador debe seguir viéndolo aunque todavía nadie se lo haya
 * asignado, que es justo el estado en que nace.
 */
export function canAccessOrder(
  access: OrderAccess,
  order: { assigned_to?: string | null; created_by?: string | null },
): boolean {
  if (access.canViewAll) return true;
  return (
    order.assigned_to === access.userId || order.created_by === access.userId
  );
}

/**
 * Filtro PostgREST equivalente a `canAccessOrder`, para no traerse pedidos
 * ajenos y descartarlos en memoria.
 */
export function assignedToMeFilter(access: OrderAccess): string {
  return `assigned_to.eq.${access.userId},created_by.eq.${access.userId}`;
}
