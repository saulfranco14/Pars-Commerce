// `orders` RLS only checks membership, so cross-tenant isolation is already
// covered. This module adds the per-role scope within one tenant.

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
  /** Touch an already-paid order: reassigning rewrites the sale's credit. */
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

  // Mirrors `requirePermission` so the flags don't depend on the migration
  // having seeded everything to the owner.
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

// "Theirs" includes `created_by`, not just `assigned_to`: whoever took an
// order keeps seeing it even when nobody is assigned yet.
export function canAccessOrder(
  access: OrderAccess,
  order: { assigned_to?: string | null; created_by?: string | null },
): boolean {
  if (access.canViewAll) return true;
  return (
    order.assigned_to === access.userId || order.created_by === access.userId
  );
}

/** `canAccessOrder` as a PostgREST filter, to narrow in the query. */
export function assignedToMeFilter(access: OrderAccess): string {
  return `assigned_to.eq.${access.userId},created_by.eq.${access.userId}`;
}
