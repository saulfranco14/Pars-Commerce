"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CreditCard,
  Loader2,
  Receipt,
  Send,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import {
  btnCustomerPrimary,
  btnCustomerSecondary,
  btnCustomerSuccess,
  btnIconDanger,
} from "@/components/ui/buttonClasses";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { CartEntry } from "@/features/qr/interfaces/tableCart";
import type { BillItem } from "@/features/qr/hooks/useBillData";

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
  /** Items already received by the business, for the inline review sheet. */
  sentItems: BillItem[] | null;
  /** True when the business marked the order ready — unlocks paying. */
  isReady: boolean;
}

/**
 * Content for the fixed bottom action bar on the table menu (rendered inside
 * <CustomerScreen>'s footer slot — it does NOT position itself). Two states:
 *
 *  1. No staged items → single "Ver cuenta" CTA (or hint if no order yet).
 *  2. Staged items    → a compact, tappable order summary followed by the
 *     primary "Enviar pedido" CTA. The summary opens a readable review sheet
 *     instead of overflowing the footer with tiny removable chips.
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
  sentItems,
  isReady,
}: TableCtaBarProps) {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const hasItems = entries.length > 0;
  const reviewTotal = orderTotal + total;

  function goToBill() {
    if (!orderId || navigating) return;
    setNavigating(true);
    router.push(`/q/${token}/table/bill?order_id=${orderId}`);
  }

  return (
    <div>
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
              className={`${
                hasSentItems && isReady
                  ? btnCustomerSuccess
                  : btnCustomerPrimary
              } w-full`}
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
          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className={`${btnCustomerSecondary} w-full justify-between text-left`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <ShoppingBag className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">
                    Pedido actual
                  </span>
                  <span className="block text-xs font-medium text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "artículo" : "artículos"} por enviar
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-foreground">
                {formatCurrency(total)}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </span>
            </button>
            <button
              type="button"
              onClick={onSend}
              disabled={saving}
              className={`${btnCustomerPrimary} w-full`}
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enviando pedido...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Enviar pedido · {formatCurrency(total)}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <FormSheet
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle de compra"
        description="Revisa lo enviado y lo que falta por enviar antes de confirmar."
        icon={Receipt}
        maxWidth="max-w-md"
      >
        <ul className="space-y-2.5 rounded-2xl border border-border bg-surface px-4 py-3">
          {sentItems?.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 border-b border-border-soft/50 pb-2.5 last:border-0 last:pb-0"
            >
              <p className="text-sm font-semibold text-foreground">
                {item.quantity}× {item.product_name}
              </p>
              <span className="shrink-0 text-sm font-bold text-foreground">
                {formatCurrency(item.subtotal)}
              </span>
            </li>
          ))}
          {entries.map((entry) => (
            <li
              key={`staged-${entry.product_id}`}
              className="flex items-start justify-between gap-3 border-b border-border-soft/50 pb-2.5 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {entry.quantity}× {entry.product_name}
                </p>
                <p className="mt-0.5 text-xs font-medium text-accent">
                  Por enviar
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(entry.quantity * entry.unit_price)}
                </span>
                <button
                  type="button"
                  onClick={() => onDecrement(entry.product_id)}
                  className={btnIconDanger}
                  aria-label={`Quitar una unidad de ${entry.product_name}`}
                  title={`Quitar una unidad de ${entry.product_name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between px-1 text-sm">
          <span className="font-semibold text-muted-foreground">Total</span>
          <span className="font-bold text-foreground">
            {formatCurrency(reviewTotal)}
          </span>
        </div>
      </FormSheet>
    </div>
  );
}
