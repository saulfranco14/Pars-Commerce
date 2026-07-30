export interface PickupTrackerCardProps {
  /** `received | in_progress | ready`. Es lo único que mueve los pasos. */
  fulfillmentStatus: string;
  /** Ciclo de cobro (`orders.status`), solo para matizar el texto. */
  orderStatus: string;
  /** El número que el cliente canta en el mostrador. */
  orderNumber: string | null;
  loading?: boolean;
}
