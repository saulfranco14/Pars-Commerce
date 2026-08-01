export interface PickupBadgeProps {
  scheduledFor: string | null | undefined;
  /** Estado del pedido: uno ya cerrado nunca se marca como atrasado. */
  status?: string | null;
  className?: string;
}
