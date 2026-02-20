"use client";

import type { TenantAddress } from "@/types/database";
import type { TicketSettings } from "@/types/ticketSettings";
import { OrderDetail, OrderItem } from "../types";
import { formatOrderDateFull } from "@/lib/formatDate";
import { formatPaymentMethod, getPaymentMethodConfig } from "@/lib/formatPaymentMethod";

interface ReceiptPreviewProps {
  order: OrderDetail;
  businessName: string;
  items: OrderItem[];
  businessAddress?: TenantAddress | null;
  ticketOptions?: TicketSettings | null;
  logoUrl?: string | null;
}

function formatAddressLine(addr: TenantAddress): string[] {
  const lines: string[] = [];
  if (addr.street) lines.push(addr.street);
  const cityState = [addr.city, addr.state].filter(Boolean).join(", ");
  if (cityState) lines.push(cityState);
  const postalCountry = [addr.postal_code, addr.country].filter(Boolean).join(", ");
  if (postalCountry) lines.push(postalCountry);
  if (addr.phone) lines.push(`Tel: ${addr.phone}`);
  return lines;
}

function shouldShow(opt: boolean | undefined): boolean {
  return opt !== false;
}

export function ReceiptPreview({
  order,
  businessName,
  items,
  businessAddress,
  ticketOptions,
  logoUrl,
}: ReceiptPreviewProps) {
  const opts = ticketOptions ?? {};
  const paymentConfig = order.payment_method ? getPaymentMethodConfig(order.payment_method) : null;
  const PaymentIcon = paymentConfig?.icon;
  const totalWholesaleSavings = items.reduce(
    (sum, i) => sum + Number(i.wholesale_savings ?? 0),
    0
  );
  const showLogo = shouldShow(opts.showLogo) && logoUrl;
  const showAddress = shouldShow(opts.showBusinessAddress) && businessAddress && formatAddressLine(businessAddress).length > 0;

  return (
    <div className="receipt-ticket mx-auto w-[302px] max-w-full font-sans text-foreground print:w-[302px] print:max-w-[302px]">
      {showLogo && (
        <div className="mb-5 flex justify-center">
          <img
            src={logoUrl}
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] object-contain"
          />
        </div>
      )}
      <h1 className="text-xl font-bold tracking-tight text-foreground text-center">
        {businessName}
      </h1>
      {(shouldShow(opts.showOrderId) || shouldShow(opts.showDate)) && (
        <p className="mt-2 text-xs text-muted">
          {opts.showOrderId !== false && `Orden ${order.id.slice(0, 8)}`}
          {opts.showOrderId !== false && opts.showDate !== false && " · "}
          {opts.showDate !== false && formatOrderDateFull(order.created_at)}
        </p>
      )}
      {shouldShow(opts.showCustomerInfo) && (order.customer_name || order.customer_email || order.customer_phone) && (
        <div className="mt-4 space-y-1">
          {(order.customer_name || order.customer_email) && (
            <p className="text-sm text-foreground">
              <span className="font-medium text-muted-foreground">Cliente:</span> {order.customer_name || order.customer_email}
            </p>
          )}
          {order.customer_phone && (
            <p className="text-sm text-foreground">
              <span className="font-medium text-muted-foreground">Tel:</span> {order.customer_phone}
            </p>
          )}
        </div>
      )}
      {shouldShow(opts.showItems) && (
        <>
          <div className="my-5 h-px bg-border" />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Productos
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-foreground">
                <th className="pb-2 pt-1 text-left text-xs font-semibold">Item</th>
                <th className="w-12 pb-2 pt-1 pr-2 text-right text-xs font-semibold">Cant.</th>
                <th className="w-16 pb-2 pt-1 pr-2 text-right text-xs font-semibold">P. unit.</th>
                <th className="w-16 pb-2 pt-1 text-right text-xs font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-2 text-left leading-snug">
                    {item.product?.name ?? "—"}
                    {item.is_wholesale && (
                      <span className="ml-1 block text-[10px] font-medium text-teal-600">
                        (Mayoreo{Number(item.wholesale_savings ?? 0) > 0 ? `, ahorro $${Number(item.wholesale_savings).toFixed(2)}` : ""})
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2.5 pr-2 text-right tabular-nums">
                    ${Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right tabular-nums font-medium">
                    ${Number(item.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resumen
        </p>
        <div className="space-y-1.5">
          {shouldShow(opts.showSubtotal) && (
            <p className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="tabular-nums">${Number(order.subtotal).toFixed(2)}</span>
            </p>
          )}
          {shouldShow(opts.showWholesaleSavings) && totalWholesaleSavings > 0 && (
            <p className="flex justify-between text-sm text-teal-700">
              <span>Ahorro por mayoreo:</span>
              <span className="tabular-nums">${totalWholesaleSavings.toFixed(2)}</span>
            </p>
          )}
          {shouldShow(opts.showDiscount) && Number(order.discount) > 0 && (
            <p className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descuento:</span>
              <span className="tabular-nums">-${Number(order.discount).toFixed(2)}</span>
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 border-t-2 border-foreground pt-4">
        <p className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">${Number(order.total).toFixed(2)}</span>
        </p>
      </div>
      {shouldShow(opts.showPaymentMethod) && order.payment_method && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded border border-border px-3 py-2 print:border-border">
          {PaymentIcon && <PaymentIcon className="h-4 w-4 shrink-0" aria-hidden />}
          <span className="text-sm">
            <span className="font-medium text-muted-foreground">Forma de pago:</span> {formatPaymentMethod(order.payment_method)}
          </span>
        </div>
      )}
      {showAddress && (
        <div className="mt-6 pt-5 border-t border-border">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ubicación
          </p>
          <div className="space-y-1 text-xs text-muted">
            {formatAddressLine(businessAddress).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
      {opts.footerMessage && (
        <p className="mt-6 pt-4 border-t border-border/60 text-center text-xs text-muted leading-relaxed">
          {opts.footerMessage}
        </p>
      )}
    </div>
  );
}
