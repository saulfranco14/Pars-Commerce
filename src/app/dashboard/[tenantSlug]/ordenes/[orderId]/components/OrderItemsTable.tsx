"use client";

import { useState, useEffect } from "react";
import { useOrder } from "../hooks/useOrder";
import { useTenantStore } from "@/stores/useTenantStore";
import { ConfirmModal } from "@/components/ConfirmModal";
import { OrderItem } from "../types";
import { Plus } from "lucide-react";
import { AddItemModal } from "@/components/orders/AddItemModal";

export function OrderItemsTable() {
  const { order, actionLoading, handleRemoveItem, handleSaveDiscount, fetchOrder } = useOrder();
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<OrderItem | null>(null);
  const [discountInput, setDiscountInput] = useState("");

  const canAddRemoveItems = order ? ["draft", "assigned"].includes(order.status) : false;
  const canEditDiscount = order ? ["draft", "assigned", "in_progress"].includes(order.status) : false;
  const items = order?.items ?? [];

  useEffect(() => {
    if (order) {
      setDiscountInput(String(Number(order.discount)));
    }
  }, [order?.discount]);

  const applyDiscount = () => {
    if (!order) return;
    const val = parseFloat(discountInput);
    if (!Number.isNaN(val) && val >= 0) {
      handleSaveDiscount(val);
    } else {
      setDiscountInput(String(Number(order.discount)));
    }
  };

  if (!order) return null;

  return (
    <div className="rounded-xl border border-border bg-surface-raised shadow-sm overflow-hidden text-left">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-base font-semibold text-foreground">Items de la orden</h2>
        {canAddRemoveItems && activeTenant && (
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
          <>
            <div className="md:hidden divide-y divide-border/50">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 p-4 hover:bg-stone-50/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground flex-1 min-w-0">
                      {item.product?.name ?? "—"}
                    </p>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      item.product?.type === "service" ? "bg-teal-50 text-teal-700" : "bg-stone-100 text-stone-600"
                    }`}>
                      {item.product?.type === "service" ? "Servicio" : "Producto"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">
                      ${Number(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                  {canAddRemoveItems && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setItemToRemove(item)}
                        disabled={actionLoading}
                        className="text-xs text-red-600 font-medium hover:text-red-700 disabled:opacity-50"
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <table className="hidden md:table w-full text-sm">
              <thead className="bg-stone-50 text-muted">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium">Descripción</th>
                  <th className="px-4 py-3 text-center font-medium">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                  {canAddRemoveItems && <th className="px-4 py-3" />}
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
                    {canAddRemoveItems && (
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
          </>
        )}
      </div>

      <div className="border-t border-border bg-stone-50/40 p-4">
        <div className="flex flex-col items-end gap-1.5 w-full sm:max-w-[260px] sm:ml-auto">
          <div className="flex justify-between items-center w-full text-sm py-1">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums font-medium text-foreground">${Number(order.subtotal).toFixed(2)}</span>
          </div>

          {(canEditDiscount || Number(order.discount) > 0) && (
            <div className="flex justify-between items-center w-full text-sm py-1">
              <span className="text-muted-foreground">Descuento</span>
              {canEditDiscount ? (
                <div className="flex items-center rounded-lg border border-border bg-white px-2.5 py-1 transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
                  <span className="pr-1 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    max={Number(order.subtotal)}
                    step="0.01"
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    onBlur={applyDiscount}
                    onKeyDown={(e) => e.key === "Enter" && applyDiscount()}
                    disabled={actionLoading}
                    placeholder="0.00"
                    className="w-20 py-1 text-right text-sm tabular-nums bg-transparent outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
                  />
                </div>
              ) : (
                <span className="tabular-nums font-medium text-foreground">
                  -${Number(order.discount).toFixed(2)}
                </span>
              )}
            </div>
          )}

          <div className="flex justify-between items-center w-full pt-2 mt-0.5 border-t border-border/80">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              ${Number(order.total).toFixed(2)}
            </span>
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
