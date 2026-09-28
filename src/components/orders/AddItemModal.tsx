"use client";

import { LineItemComposer } from "@/features/line-item-composer/LineItemComposer";
import { createBatch } from "@/services/orderItemsService";
import type { AddItemModalProps } from "@/features/orders/interfaces/addItemModal";

/** Backwards-compatible order entry wrapper around the shared Ticket vivo. */
export function AddItemModal({ tenantId, orderId, isOpen, onClose, onAdded }: AddItemModalProps) {
  return <LineItemComposer
    tenantId={tenantId}
    documentKey={`order:${orderId}`}
    isOpen={isOpen}
    onClose={onClose}
    title="Agregar al ticket"
    commitLabel="Agregar artículos al ticket"
    onCommit={async (items) => {
      await createBatch(orderId, items);
      onAdded();
    }}
  />;
}
