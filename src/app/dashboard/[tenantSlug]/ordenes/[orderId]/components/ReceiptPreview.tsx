"use client";

import { OrderDetail, OrderItem } from "../types";
import { formatOrderDate } from "@/lib/formatDate";

interface ReceiptPreviewProps {
  order: OrderDetail;
  businessName: string;
  items: OrderItem[];
}

export function ReceiptPreview({ order, businessName, items }: ReceiptPreviewProps) {
  return (
    <div className="mx-auto max-w-sm font-sans text-foreground">
      <p className="text-lg font-bold">{businessName}</p>
      <p className="text-sm text-muted">
        Orden {order.id.slice(0, 8)} · {formatOrderDate(order.created_at)}
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
              <td className="py-2 text-left">{item.product?.name ?? "—"}</td>
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
      {Number(order.discount) > 0 && (
        <p className="text-right text-sm">
          Descuento: -${Number(order.discount).toFixed(2)}
        </p>
      )}
      <p className="mt-1 border-t-2 border-foreground pt-2 text-right font-bold">
        Total: ${Number(order.total).toFixed(2)}
      </p>
    </div>
  );
}
