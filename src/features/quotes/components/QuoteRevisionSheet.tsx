"use client";

import { LineItemComposer } from "@/features/line-item-composer/LineItemComposer";

export type DraftQuote = {
  id: string;
  quote_number: string;
  version?: number;
  customer_change_note?: string | null;
  items?: Array<{ product_id?: string; quantity: number }>;
};

type Props = { isOpen: boolean; onClose: () => void; tenantId: string; quote: DraftQuote | null; onSaved: () => void };

/** A new quote version opens with the prior selection, ready for rapid edits. */
export function QuoteRevisionSheet({ isOpen, onClose, tenantId, quote, onSaved }: Props) {
  if (!quote) return null;
  return <LineItemComposer
    tenantId={tenantId}
    documentKey={`quote:${quote.id}:revision`}
    isOpen={isOpen}
    onClose={onClose}
    title={`Ajustar ${quote.quote_number}`}
    commitLabel="Guardar nueva versión"
    initialItems={(quote.items ?? []).flatMap((item) => item.product_id ? [{ product_id: item.product_id, quantity: item.quantity }] : [])}
    onCommit={async (items) => {
      const response = await fetch(`/api/quotes/${quote.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "No pudimos guardar la nueva versión.");
      onSaved();
    }}
  />;
}
