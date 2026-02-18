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
        <div className="mb-3 flex justify-center">
          <img
            src={logoUrl}
            alt=""
            width={72}
            height={72}
            className="h-[72px] w-[72px] object-contain"
          />
        </div>
      )}
      <h1 className="text-xl font-bold tracking-tight text-foreground">
        {businessName}
      </h1>
      {(shouldShow(opts.showOrderId) || shouldShow(opts.showDate)) && (
        <p className="mt-1 text-xs text-muted">
          {opts.showOrderId !== false && `Orden ${order.id.slice(0, 8)}`}
          {opts.showOrderId !== false && opts.showDate !== false && " · "}
          {opts.showDate !== false && formatOrderDateFull(order.created_at)}
        </p>
      )}
      {shouldShow(opts.showCustomerInfo) && (order.customer_name || order.customer_email) && (
        <p className="mt-3 text-sm text-foreground">
          Cliente: {order.customer_name || order.customer_email}
        </p>
      )}
      {shouldShow(opts.showCustomerInfo) && order.customer_phone && (
        <p className="text-sm text-foreground">Tel: {order.customer_phone}</p>
      )}
      {shouldShow(opts.showItems) && (
        <>
          <div className="my-3 h-px bg-border" />
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-1.5 text-left text-xs font-medium">Item</th>
                <th className="w-10 py-1.5 text-right text-xs font-medium">Cant.</th>
                <th className="w-14 py-1.5 text-right text-xs font-medium">P.unit</th>
                <th className="w-14 py-1.5 text-right text-xs font-medium">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/60">
                  <td className="py-1.5 text-left">
                    {item.product?.name ?? "—"}
                    {item.is_wholesale && (
                      <span className="ml-1 text-[10px] font-medium text-teal-600">
                        (Mayoreo{Number(item.wholesale_savings ?? 0) > 0 ? `, ahorro $${Number(item.wholesale_savings).toFixed(2)}` : ""})
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 text-right">{item.quantity}</td>
                  <td className="py-1.5 text-right">
                    ${Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right">
                    ${Number(item.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <div className="mt-3 space-y-0.5">
        {shouldShow(opts.showSubtotal) && (
          <p className="text-right text-sm">Subtotal: ${Number(order.subtotal).toFixed(2)}</p>
        )}
        {shouldShow(opts.showWholesaleSavings) && totalWholesaleSavings > 0 && (
          <p className="text-right text-sm text-teal-700">
            Ahorro por mayoreo: ${totalWholesaleSavings.toFixed(2)}
          </p>
        )}
        {shouldShow(opts.showDiscount) && Number(order.discount) > 0 && (
          <p className="text-right text-sm">Descuento: -${Number(order.discount).toFixed(2)}</p>
        )}
      </div>
      <div className="mt-2 border-t-2 border-foreground pt-2">
        <p className="text-right text-base font-bold">Total: ${Number(order.total).toFixed(2)}</p>
      </div>
      {shouldShow(opts.showPaymentMethod) && order.payment_method && (
        <p className="mt-2 flex items-center justify-end gap-1.5 text-right text-sm">
          {PaymentIcon && <PaymentIcon className="h-4 w-4 shrink-0" aria-hidden />}
          <span>Forma de pago: {formatPaymentMethod(order.payment_method)}</span>
        </p>
      )}
      {showAddress && (
        <div className="mt-4 pt-4 border-t border-border text-xs text-muted space-y-0.5">
          {formatAddressLine(businessAddress).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
      {opts.footerMessage && (
        <p className="mt-4 pt-3 border-t border-border/60 text-center text-xs text-muted">
          {opts.footerMessage}
        </p>
      )}
    </div>
  );
}
