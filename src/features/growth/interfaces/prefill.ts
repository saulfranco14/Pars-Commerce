import type { PickupPointDraft } from "@/features/configuracion/interfaces/paymentsAndDelivery";

/** What a claimed store already told us, so setup doesn't ask for it again. */
export interface ProspectPrefill {
  pickupPoint: PickupPointDraft | null;
}
