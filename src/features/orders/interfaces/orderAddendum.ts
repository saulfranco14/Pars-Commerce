import type { RequestedItem } from "@/features/qr/helpers/buildOrderItemRows";

export interface CreateAddendumInput {
  /** Pedido ya pagado al que se le complementa. */
  parentOrderId: string;
  /** `tenant_memberships.id` — atribuye los ítems (`added_by_member_id`). */
  actorMembershipId: string;
  /** `auth.users.id` — llena `created_by` y `assigned_to`. */
  actorUserId: string;
  items: RequestedItem[];
  /** Por qué se está complementando. Queda en el registro de actividad. */
  reason?: string | null;
}

export interface CreateAddendumResult {
  orderId: string;
  parentOrderId: string;
  total: number;
}
