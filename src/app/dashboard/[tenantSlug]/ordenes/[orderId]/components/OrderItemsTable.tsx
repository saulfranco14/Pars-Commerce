"use client";

import { useState, useEffect } from "react";
import { useOrder } from "../hooks/useOrder";
import { useTenantStore } from "@/stores/useTenantStore";
import { ConfirmModal } from "@/components/ConfirmModal";
import { OrderItem } from "../types";
import { Plus } from "lucide-react";
import { AddItemModal } from "@/components/orders/AddItemModal";

export function OrderItemsTable() {
  const { order, actionLoading, handleRemoveItem, fetchOrder } = useOrder();
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<OrderItem | null>(null);

  if (!order) return null;

  const canEdit = ["draft", "assigned", "in_progress"].includes(order.status);
  const items = order.items ?? [];

  return (
    <div className="rounded-xl border border-border bg-surface-raised shadow-sm overflow-hidden text-left">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-base font-semibold text-foreground">Items de la orden</h2>
        {canEdit && activeTenant && (
          <button
            type="button"
            onClick={() => setAddItemOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar item
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">
            No hay items. Agrega productos o servicios.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-muted">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-medium">Descripción</th>
                <th className="px-4 py-3 text-center font-medium">Tipo</th>
                <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                {canEdit && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/30">
                  <td className="px-4 py-3 text-foreground font-medium">
                    {item.product?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      item.product?.type === "service" ? "bg-teal-50 text-teal-700" : "bg-stone-100 text-stone-600"
                    }`}>
                      {item.product?.type === "service" ? "Servicio" : "Producto"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-stone-600">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-stone-600">
                    ${Number(item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">
                    ${Number(item.subtotal).toFixed(2)}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setItemToRemove(item)}
                        disabled={actionLoading}
                        className="text-red-600 font-medium hover:text-red-700 disabled:opacity-50"
                      >
                        Quitar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border-t border-border bg-stone-50/30 p-4">
        <div className="flex flex-col items-end gap-1">
          <div className="flex justify-between gap-8 text-sm text-stone-600 w-48">
            <span className="font-medium">Subtotal:</span>
            <span>${Number(order.subtotal).toFixed(2)}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between gap-8 text-sm text-teal-600 w-48">
              <span className="font-medium">Descuento:</span>
              <span>-${Number(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between gap-8 text-lg font-bold text-foreground w-48 mt-1 pt-1 border-t border-border/50">
            <span>Total:</span>
            <span>${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {activeTenant && (
        <AddItemModal
          tenantId={activeTenant.id}
          orderId={order.id}
          isOpen={addItemOpen}
          onClose={() => setAddItemOpen(false)}
          onAdded={() => fetchOrder()}
        />
      )}

      <ConfirmModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={async () => {
          if (itemToRemove) {
            await handleRemoveItem(itemToRemove.id);
            setItemToRemove(null);
          }
        }}
        title="Quitar item"
        message={`¿Estás seguro de que deseas quitar "${itemToRemove?.product?.name}" de la orden?`}
        confirmLabel="Quitar"
        confirmDanger={true}
        loading={actionLoading}
      />
    </div>
  );
}
