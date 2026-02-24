"use client";

import { useOrder } from "@/features/orders/hooks/useOrder";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Copy, Check, ExternalLink, ChevronDown } from "lucide-react";
import { calcBuyerTotal, TARIFA_DE_SERVICIO_LABEL } from "@/constants/commissionConfig";
import type { OrderPayment } from "../interfaces/orderDetail";

function DesgloseSummary({ isPaid }: { isPaid: boolean }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Image
        src="/mercadopago-logo.svg"
        alt="Mercado Pago"
        width={24}
        height={24}
        className="shrink-0"
      />
      <span className="text-sm font-semibold text-foreground">
        {isPaid ? "Pago recibido" : "Link de pago"}
      </span>
      <span className="text-muted-foreground">·</span>
      <span className="text-xs text-muted-foreground">MercadoPago</span>
    </div>
  );
}

export function PaymentLinkCard() {
  const { order } = useOrder();
  const [copied, setCopied] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasPaymentLink = !!order?.payment_link;
  const hasPaidBreakdown =
    order?.payment_method === "mercadopago" && order?.status === "paid";
  const hasMercadoPago = hasPaymentLink || hasPaidBreakdown;

  useEffect(() => {
    if (order?.status === "paid") {
      setDesktopOpen(true);
      setMobileOpen(true);
    }
  }, [order?.status]);

  if (!order || !hasMercadoPago) return null;

  const handleCopy = async () => {
    if (!order.payment_link) return;
    try {
      await navigator.clipboard.writeText(order.payment_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = order.payment_link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isPaid = order.status === "paid";

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-surface-raised text-left shadow-sm">
      <details
        open={desktopOpen}
        onToggle={(e) => setDesktopOpen((e.target as HTMLDetailsElement).open)}
        className="group hidden md:block [&>summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-4 py-2">
          <DesgloseSummary isPaid={isPaid} />
          <div className="flex shrink-0 items-center gap-2">
            {isPaid ? (
              <span className="rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1 text-xs font-semibold text-white dark:border-emerald-500 dark:bg-emerald-500">
                Pagado
              </span>
            ) : (
              <span className="rounded-full border border-amber-600 bg-amber-500 px-3 py-1 text-xs font-semibold text-white dark:border-amber-500 dark:bg-amber-500">
                Pendiente
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
          </div>
        </summary>
        <div className="border-t border-border/50 px-4 py-3">
          <DesgloseContent
            order={order}
            isPaid={isPaid}
            copied={copied}
            onCopy={handleCopy}
          />
        </div>
      </details>
      <details
        open={mobileOpen}
        onToggle={(e) => setMobileOpen((e.target as HTMLDetailsElement).open)}
        className="group border-t-0 md:hidden [&>summary::-webkit-details-marker]:hidden"
      >
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-3 py-2">
          <DesgloseSummary isPaid={isPaid} />
          <div className="flex shrink-0 items-center gap-2">
            {isPaid ? (
              <span className="rounded-full border border-emerald-600 bg-emerald-600 px-3 py-1 text-xs font-semibold text-white dark:border-emerald-500 dark:bg-emerald-500">
                Pagado
              </span>
            ) : (
              <span className="rounded-full border border-amber-600 bg-amber-500 px-3 py-1 text-xs font-semibold text-white dark:border-amber-500 dark:bg-amber-500">
                Pendiente
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
          </div>
        </summary>
        <div className="border-t border-border/50 px-3 py-3">
          <DesgloseContent
            order={order}
            isPaid={isPaid}
            copied={copied}
            onCopy={handleCopy}
          />
        </div>
      </details>
    </div>
  );
}

function DesgloseContent({
  order,
  isPaid,
  copied,
  onCopy,
}: {
  order: {
    total: number;
    payment_link?: string | null;
    payments?: OrderPayment[];
  };
  isPaid: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  const payments = order.payments as OrderPayment[] | undefined;
  const mpPayment = Array.isArray(payments)
    ? payments.find((p) => p.provider === "mercadopago")
    : null;
  const metadata = mpPayment?.metadata;
  const transactionAmount = mpPayment?.amount ?? Number(order.total);
  const mpFee = metadata?.mp_fee_amount ?? 0;
  const parsFee = metadata?.pars_fee_amount ?? 0;
  const vendorReceived = Number(order.total);

  if (isPaid) {
    return (
      <>
        <h2 className="mb-3 text-xs font-semibold text-muted uppercase tracking-wider">
          Desglose de pagos – Mercado Pago
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total de la orden (recibido)</span>
            <span className="tabular-nums font-medium">${vendorReceived.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Comisión Mercado Pago</span>
            <span className="tabular-nums">${mpFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{TARIFA_DE_SERVICIO_LABEL}</span>
            <span className="tabular-nums">${parsFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
            <span className="text-muted-foreground">Total pagado por el cliente</span>
            <span className="tabular-nums">${transactionAmount.toFixed(2)}</span>
          </div>
        </div>
      </>
    );
  }

  const { total: buyerTotal, mpFee: estMpFee, parsFee: estParsFee } = calcBuyerTotal(
    Number(order.total),
  );

  return (
    <>
      <h2 className="mb-3 text-xs font-semibold text-muted uppercase tracking-wider">
        Desglose de pagos – Mercado Pago
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Envía este link al cliente para que realice el pago por MercadoPago.
      </p>

      <div className="mb-4 space-y-1.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total venta (recibirás)</span>
          <span className="tabular-nums font-medium text-foreground">
            ${Number(order.total).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Comisión MP + {TARIFA_DE_SERVICIO_LABEL}</span>
          <span className="tabular-nums text-foreground">
            ${(estMpFee + estParsFee).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
          <span className="text-muted-foreground">Cliente pagará</span>
          <span className="tabular-nums text-foreground">${buyerTotal.toFixed(2)}</span>
        </div>
      </div>

      {order.payment_link && (
        <div className="space-y-3">
          <div className="min-w-0 rounded-lg border border-border bg-background px-3 py-2.5">
            <span
              className="block truncate text-sm text-muted-foreground"
              title={order.payment_link}
            >
              {order.payment_link}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors duration-200 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              title="Copiar link"
              aria-label={copied ? "Link copiado" : "Copiar link de pago"}
            >
              {copied ? (
                <>
                  <Check size={18} aria-hidden />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy size={18} aria-hidden />
                  <span>Copiar</span>
                </>
              )}
            </button>
            <a
              href={order.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-border-soft hover:border-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              title="Abrir link en nueva pestaña"
              aria-label="Abrir link de pago en nueva pestaña"
            >
              <ExternalLink size={18} aria-hidden />
              <span>Abrir</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
