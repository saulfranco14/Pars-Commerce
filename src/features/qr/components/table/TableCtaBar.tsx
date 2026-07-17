"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Receipt, Send, X } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { CartEntry } from "@/features/qr/interfaces/tableCart";

interface TableCtaBarProps {
  token: string;
  orderId: string | null;
  entries: CartEntry[];
  total: number;
  itemCount: number;
  saving: boolean;
  onSend: () => void;
  onDecrement: (productId: string) => void;
  /** Running total of items already sent to the business. */
  orderTotal: number;
  /** True once at least one batch has been sent to the business. */
  hasSentItems: boolean;
  /** True when the business marked the order ready — unlocks paying. */
  isReady: boolean;
}

/**
 * Content for the fixed bottom action bar on the table menu (rendered inside
 * <CustomerScreen>'s footer slot — it does NOT position itself). Two states:
 *
 *  1. No staged items → single "Ver cuenta" CTA (or hint if no order yet).
 *  2. Staged items    → "Ver cuenta" icon button + "Enviar pedido · $X" CTA
 *     with an item-count badge and a chip list of staged items.
 *
 * Navigation to the bill uses the router (not a bare <Link>) so we can show an
 * immediate spinner while the next screen loads — no dead "nothing happened"
 * gap after the tap.
 */
export function TableCtaBar({
  token,
  orderId,
  entries,
  total,
  itemCount,
  saving,
  onSend,
  onDecrement,
  orderTotal,
  hasSentItems,
  isReady,
}: TableCtaBarProps) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const hasItems = entries.length > 0;

  function goToBill() {
    if (!orderId || navigating) return;
    setNavigating(true);
    router.push(`/q/${token}/table/bill?order_id=${orderId}`);
  }

  return (
    <div>
      {hasItems && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {entries.map((e) => (
            <div
              key={e.product_id}
              className="flex items-center gap-1 rounded-full bg-border-soft/60 px-2.5 py-1 text-xs font-medium text-foreground"
            >
              <span>{e.quantity}×</span>
              <span className="max-w-[120px] truncate">{e.product_name}</span>
              <button
                type="button"
                onClick={() => onDecrement(e.product_id)}
                aria-label={`Quitar ${e.product_name}`}
                className="ml-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* When ready to pay, surface it as a banner above the CTA so the
          "ya puedes pagar" moment is unmissable even mid-scroll. */}
      {!hasItems && hasSentItems && isReady && (
        <p className="mb-2 text-center text-xs font-semibold text-emerald-600">
          ¡Tu pedido está listo! Ya puedes pagar tu cuenta.
        </p>
      )}

      <div className="flex items-center gap-2">
        {!hasItems ? (
          orderId ? (
            <button
              type="button"
              onClick={goToBill}
              disabled={navigating}
              className={`inline-flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 text-base font-bold shadow-md transition-all active:scale-[0.99] disabled:opacity-70 ${
                hasSentItems && isReady
                  ? "bg-emerald-600 text-white shadow-emerald-600/25 hover:bg-emerald-700"
                  : "bg-accent text-accent-foreground shadow-accent/20 hover:bg-accent/90"
              }`}
            >
              {navigating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Abriendo cuenta...
                </>
              ) : hasSentItems && isReady ? (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pagar {formatCurrency(orderTotal)}
                </>
              ) : hasSentItems ? (
                <>
                  <Receipt className="h-5 w-5" />
                  Ver cuenta · {formatCurrency(orderTotal)}
                </>
              ) : (
                <>
                  <Receipt className="h-5 w-5" />
                  Ver cuenta
                </>
              )}
            </button>
          ) : (
            <p className="w-full text-center text-sm text-muted-foreground">
              Agrega productos para hacer tu pedido.
            </p>
          )
        ) : (
          <>
            {orderId && (
              <button
                type="button"
                onClick={goToBill}
                disabled={navigating}
                className="inline-flex h-[54px] w-[54px] shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-border bg-surface text-foreground transition-colors hover:bg-border-soft/40 disabled:opacity-70"
                aria-label="Ver cuenta"
              >
                {navigating ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Receipt className="h-5 w-5" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onSend}
              disabled={saving}
              className="relative inline-flex min-h-[54px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background shadow">
                {itemCount}
              </span>
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Enviar pedido · {formatCurrency(total)}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
