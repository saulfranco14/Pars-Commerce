"use client";

import type { TenantAddress } from "@/types/database";
import { OrderDetail, OrderItem } from "../types";
import { formatOrderDateFull } from "@/lib/formatDate";
import { formatPaymentMethod, getPaymentMethodConfig } from "@/lib/formatPaymentMethod";

interface ReceiptPreviewProps {
  order: OrderDetail;
  businessName: string;
  items: OrderItem[];
  businessAddress?: TenantAddress | null;
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

export function ReceiptPreview({ order, businessName, items, businessAddress }: ReceiptPreviewProps) {
  const paymentConfig = order.payment_method ? getPaymentMethodConfig(order.payment_method) : null;
  const PaymentIcon = paymentConfig?.icon;
  const totalWholesaleSavings = items.reduce(
    (sum, i) => sum + Number(i.wholesale_savings ?? 0),
    0
  );

  return (
    <div className="mx-auto max-w-sm font-sans text-foreground">
      <p className="text-lg font-bold">{businessName}</p>
      <p className="text-sm text-muted">
        Orden {order.id.slice(0, 8)} · {formatOrderDateFull(order.created_at)}
      </p>
      {(order.customer_name || order.customer_email) && (
        <p className="mt-2 text-sm">
          Cliente: {order.customer_name || order.customer_email}
        </p>
      )}
      {order.customer_phone && (
        <p className="text-sm">Tel: {order.customer_phone}</p>
      )}
      <table className="mt-4 w-full table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 text-left font-medium">Item</th>
            <th className="w-12 py-2 text-right font-medium">Cant.</th>
            <th className="w-20 py-2 text-right font-medium">P.unit</th>
            <th className="w-20 py-2 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border-soft">
              <td className="py-2 text-left">
                {item.product?.name ?? "—"}
                {item.is_wholesale && (
                  <span className="ml-1 text-[10px] font-medium text-teal-600">
                    (Mayoreo{Number(item.wholesale_savings ?? 0) > 0 ? `, ahorro $${Number(item.wholesale_savings).toFixed(2)}` : ""})
                  </span>
                )}
              </td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">
                ${Number(item.unit_price).toFixed(2)}
              </td>
              <td className="py-2 text-right">
                ${Number(item.subtotal).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-right text-sm">
        Subtotal: ${Number(order.subtotal).toFixed(2)}
      </p>
      {totalWholesaleSavings > 0 && (
        <p className="text-right text-sm text-teal-700">
          Ahorro por mayoreo: ${totalWholesaleSavings.toFixed(2)}
        </p>
      )}
      {Number(order.discount) > 0 && (
        <p className="text-right text-sm">
          Descuento: -${Number(order.discount).toFixed(2)}
        </p>
      )}
      <p className="mt-1 border-t-2 border-foreground pt-2 text-right font-bold">
        Total: ${Number(order.total).toFixed(2)}
      </p>
      {order.payment_method && (
        <p className="mt-2 flex items-center justify-end gap-1.5 text-right text-sm">
          {PaymentIcon && <PaymentIcon className="h-4 w-4 shrink-0" aria-hidden />}
          <span>Forma de pago: {formatPaymentMethod(order.payment_method)}</span>
        </p>
      )}
      {businessAddress && formatAddressLine(businessAddress).length > 0 && (
        <div className="mt-4 pt-4 border-t border-border text-xs text-muted space-y-0.5">
          {formatAddressLine(businessAddress).map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
