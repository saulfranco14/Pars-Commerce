/**
 * Alcance de un usuario sobre los pedidos de un negocio.
 *
 * La RLS de `orders` solo comprueba membresía, así que el aislamiento ENTRE
 * negocios ya está cubierto por la base. Lo que resuelve este módulo es el
 * alcance DENTRO de un mismo negocio, que la base no sabe.
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
  canViewAll: boolean;
  canWrite: boolean;
  canAssign: boolean;
  canClose: boolean;
  /**
   * Tocar un pedido YA PAGADO. Reasignar uno pagado reescribe a quién se le
   * atribuye la venta, así que pide el mismo permiso que la orden ligada.
   */
  canTouchPaid: boolean;
}

const FORBIDDEN: ServiceError = {
  code: "forbidden",
  message: "No tienes permiso para ver los pedidos de este negocio.",
};

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

  // Se repite el criterio de `requirePermission` para que los flags no
  // dependan de que la migración le sembrara todo al owner.
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
 * "Suyo" incluye `created_by` y no solo `assigned_to`: quien levanta un pedido
 * debe seguir viéndolo aunque nadie se lo haya asignado.
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

/** Equivalente de `canAccessOrder` en PostgREST, para recortar en la consulta. */
export function assignedToMeFilter(access: OrderAccess): string {
  return `assigned_to.eq.${access.userId},created_by.eq.${access.userId}`;
}
