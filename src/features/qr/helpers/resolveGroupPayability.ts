/**
 * Pure helper: decide the payment/preparation state of a split group for the
 * customer bill. Extracted from the render loop so the branching lives in one
 * SRP-focused place (not recomputed inline per row) and can be unit-tested.
 */

import type { BillDevice } from "@/features/qr/interfaces/billSummary";
import type { SplitGroup } from "@/features/qr/interfaces/splitBill";

export interface GroupPayability {
  isPaid: boolean;
  isPending: boolean;
  isMine: boolean;
  /** Per-person gate: a group tied to a device can pay when THAT person is
   *  ready; a group without a device falls back to the order-level `canPay`. */
  ready: boolean;
  /** Show the "En preparación" hint (has a device, not ready, not paid). */
  showPreparing: boolean;
  /** Show the "Pagar" button. */
  showPay: boolean;
}

export function resolveGroupPayability(
  group: SplitGroup,
  devices: BillDevice[],
  currentDeviceId: string | null,
  orderCanPay: boolean,
  hasPayHandler: boolean,
): GroupPayability {
  const isPaid = group.payment_status === "paid";
  const isPending = group.payment_status === "pending_validation";
  const isMine = !!group.device_id && group.device_id === currentDeviceId;

  const groupDevice = group.device_id
    ? devices.find((d) => d.id === group.device_id)
    : undefined;
  const ready = groupDevice
    ? groupDevice.fulfillment_status === "ready"
    : orderCanPay;

  return {
    isPaid,
    isPending,
    isMine,
    ready,
    showPreparing: !isPaid && !isPending && !ready && !!group.device_id,
    showPay: !isPaid && !isPending && ready && hasPayHandler,
  };
}

/** Whether the groups constitute a real split (vs a single whole-order group). */
export function isSplitBill(groups: SplitGroup[]): boolean {
  return (
    groups.length > 1 ||
    (groups.length === 1 && groups[0].device_id !== null)
  );
}
