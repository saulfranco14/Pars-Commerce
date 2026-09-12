"use client";

import { useState } from "react";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { useActiveTenant } from "@/stores/useTenantStore";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { OrderItem } from "@/features/orders/interfaces/orderDetail";
import { Package, Plus, Tag, Trash2, Wrench } from "lucide-react";
import { AddItemModal } from "@/components/orders/AddItemModal";
import { OrderActionButtons } from "@/features/orders/components/order/OrderActionButtons";
import { DiscountModal } from "@/features/orders/components/payment/DiscountModal";
import { btnIconDanger, btnPrimary } from "@/components/ui/buttonClasses";

function ItemThumbnail({ item }: { item: OrderItem }) {
  const product = item.product;

  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-border-soft/50">
      {product?.image_url ? (
        // Tenant images can be served from different Storage domains.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image_url}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : product?.type === "service" ? (
        <Wrench className="h-4 w-4 text-accent" aria-hidden />
      ) : (
        <Package className="h-4 w-4 text-muted" aria-hidden />
      )}
    </span>
  );
}

export function OrderItemsTable() {
  const {
    order,
    actionLoading,
    handleRemoveItem,
    handleSaveDiscount,
    fetchOrder,
  } = useOrder();
  const activeTenant = useActiveTenant();
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<OrderItem | null>(null);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);

  const canAddRemoveItems = order
    ? ["draft", "assigned"].includes(order.status)
    : false;
  const canEditDiscount = order
    ? ["draft", "assigned", "in_progress"].includes(order.status)
    : false;
  const items = order?.items ?? [];
  const totalWholesaleSavings = items.reduce(
    (sum, i) => sum + Number(i.wholesale_savings ?? 0),
    0,
  );

  if (!order) return null;

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface-raised text-left shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border p-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Productos y servicios
          </h2>
          {order.order_type && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {order.order_type === "dine_in" && "Tipo: Mesa"}
              {order.order_type === "takeaway" && "Tipo: Para llevar"}
              {order.order_type === "qr_payment" && "Tipo: Cobro QR"}
              {order.table_label ? ` · ${order.table_label}` : ""}
            </p>
          )}
        </div>
        {canAddRemoveItems && activeTenant && (
          <button
            type="button"
            onClick={() => setAddItemOpen(true)}
            className={btnPrimary}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Agregar
          </button>
        )}
      </div>

      <div className="flex min-h-52 min-w-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain md:max-h-75">
        {items.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-border-soft text-muted">
              <Package className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">
              Esta orden aún está vacía
            </p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Agrega los productos o servicios que llevará el cliente.
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-border/50">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 hover:bg-border-soft/20"
                >
                  <ItemThumbnail item={item} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex flex-1 flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-foreground">
                        {item.product?.name ?? "—"}
                        </p>
                        {item.is_wholesale && (
                          <span className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                            Mayoreo
                          </span>
                        )}
                      </div>
                      {canAddRemoveItems && (
                        <button
                          type="button"
                          onClick={() => setItemToRemove(item)}
                          disabled={actionLoading}
                          className={`${btnIconDanger} -mr-1 -mt-1 min-h-9 min-w-9`}
                          aria-label={`Quitar ${item.product?.name ?? "producto"}`}
                          title="Quitar de la orden"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {item.quantity} × ${Number(item.unit_price).toFixed(2)}
                        {Number(item.wholesale_savings ?? 0) > 0 && (
                          <span className="ml-1.5 font-medium text-emerald-700">
                            Ahorro ${Number(item.wholesale_savings).toFixed(2)}
                          </span>
                        )}
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        ${Number(item.subtotal).toFixed(2)}
                      </span>
                    </div>
                    <span
                      className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        item.product?.type === "service"
                          ? "bg-accent/10 text-accent"
                          : "bg-border-soft text-muted-foreground"
                      }`}
                    >
                      {item.product?.type === "service" ? "Servicio" : "Producto"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <table className="hidden md:table w-full text-sm">
              <thead className="bg-background/30 text-muted">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-center font-medium">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium">Cantidad</th>
                  <th className="px-4 py-3 text-right font-medium">Precio</th>
                  <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                  {canAddRemoveItems && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-border-soft/20">
                    <td className="px-4 py-3 text-foreground font-medium">
                      <span className="flex items-center gap-3">
                        <ItemThumbnail item={item} />
                        <span className="min-w-0">
                          <span className="block truncate">{item.product?.name ?? "—"}</span>
                          {item.is_wholesale && (
                            <span className="mt-1 inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                              Mayoreo
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          item.product?.type === "service"
                            ? "bg-accent/10 text-accent"
                            : "bg-border-soft text-muted-foreground"
                        }`}
                      >
                        {item.product?.type === "service"
                          ? "Servicio"
                          : "Producto"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      <span>
                        ${Number(item.unit_price).toFixed(2)}
                        {Number(item.wholesale_savings ?? 0) > 0 && (
                          <span className="block text-[10px] font-medium text-emerald-700">
                            ahorro ${Number(item.wholesale_savings).toFixed(2)}
                          </span>
                        )}
                      </span>
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
                        className={btnIconDanger}
                        aria-label={`Quitar ${item.product?.name ?? "producto"}`}
                        title="Quitar de la orden"
                      >
                          <Trash2 className="h-4 w-4" aria-hidden />
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

      <div className="shrink-0 border-t border-border bg-background/20 p-3">
        <div className="flex flex-col items-end gap-1 w-full sm:max-w-65 sm:ml-auto">
          <div className="flex justify-between items-center w-full text-sm py-1">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums font-medium text-foreground">
              ${Number(order.subtotal).toFixed(2)}
            </span>
          </div>

          {totalWholesaleSavings > 0 && (
            <div className="flex justify-between items-center w-full text-sm py-1">
              <span className="font-medium text-emerald-700">
                Ahorro por mayoreo
              </span>
              <span className="font-medium tabular-nums text-emerald-700">
                ${totalWholesaleSavings.toFixed(2)}
              </span>
            </div>
          )}

          {canEditDiscount && Number(order.discount) === 0 && (
            <div className="flex justify-between items-center w-full text-sm py-1">
              <span className="text-muted-foreground">Descuento</span>
              <button
                type="button"
                onClick={() => setDiscountModalOpen(true)}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:border-accent hover:text-accent"
              >
                <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Agregar
              </button>
            </div>
          )}
          {canEditDiscount && Number(order.discount) > 0 && (
            <div className="flex justify-between items-center w-full text-sm py-1">
              <span className="text-muted-foreground">Descuento</span>
              <button
                type="button"
                onClick={() => setDiscountModalOpen(true)}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium text-red-600 transition-colors duration-200 hover:bg-red-50"
              >
                <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                -${Number(order.discount).toFixed(2)}
              </button>
            </div>
          )}
          {!canEditDiscount && Number(order.discount) > 0 && (
            <div className="flex justify-between items-center w-full text-sm py-1">
              <span className="text-muted-foreground">Descuento</span>
              <span className="tabular-nums font-medium text-foreground">
                -${Number(order.discount).toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center w-full pt-1.5 mt-0 border-t border-border/80">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              ${Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 hidden border-t border-border p-3 md:block">
        <OrderActionButtons embedded />
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

      <DiscountModal
        isOpen={discountModalOpen}
        onClose={() => setDiscountModalOpen(false)}
        onApply={async (amount) => {
          await handleSaveDiscount(amount);
          setDiscountModalOpen(false);
        }}
        onRemove={async () => {
          await handleSaveDiscount(0);
          setDiscountModalOpen(false);
        }}
        subtotal={Number(order.subtotal)}
        currentDiscount={Number(order.discount)}
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={async () => {
          if (itemToRemove) {
            await handleRemoveItem(itemToRemove.id);
            setItemToRemove(null);
          }
        }}
        title="Quitar de la orden"
        message={`¿Quieres quitar "${itemToRemove?.product?.name}" de esta orden?`}
        confirmLabel="Quitar"
        confirmDanger={true}
        loading={actionLoading}
      />
    </div>
  );
}
