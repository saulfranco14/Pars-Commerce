"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { PackagePlus, Plus, X } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { TouchStepper } from "@/components/ui/TouchStepper";
import { ProductSearchCombobox } from "@/components/orders/ProductSearchCombobox";
import { btnPrimaryFlex, btnSecondaryFlex } from "@/components/ui/buttonClasses";

import { createAddendum } from "@/features/orders/services/orderAddendumClientService";
import { swrFetcher } from "@/lib/swrFetcher";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { ProductListItem } from "@/types/products";
import type {
  AddendumSheetProps,
  DraftItem,
} from "@/features/orders/interfaces/addendumSheet";

/**
 * "Agregar lo que faltó": arma el pedido complementario de uno ya pagado.
 *
 * Se puede poner más de un producto antes de confirmar porque el caso real
 * rara vez es uno solo, y crear un pedido complementario por producto llenaría
 * la lista de pedidos de $50 sueltos.
 *
 * No re-ocupa la mesa: eso lo garantiza el servidor
 * (`orderAddendumService`), no esta pantalla.
 */
export function AddendumSheet({
  isOpen,
  onClose,
  tenantId,
  parentOrderId,
  onCreated,
}: AddendumSheetProps) {
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: products } = useSWR<ProductListItem[]>(
    isOpen && tenantId
      ? `/api/products?tenant_id=${encodeURIComponent(tenantId)}`
      : null,
    swrFetcher,
    { fallbackData: [] },
  );
  const catalog = products ?? [];

  // Al cerrar se descarta el borrador: dejarlo vivo haría que la siguiente vez
  // que alguien abra la hoja se encuentre productos de otro pedido.
  useEffect(() => {
    if (isOpen) return;
    setDraft([]);
    setProductId("");
    setQuantity(1);
    setReason("");
    setError(null);
  }, [isOpen]);

  const total = draft.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  function addToDraft() {
    const product = catalog.find((p) => p.id === productId);
    if (!product) return;
    setDraft((current) => {
      // Si ya está en la lista se suma la cantidad, en vez de repetir la línea.
      const existing = current.find((i) => i.productId === product.id);
      if (existing) {
        return current.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          unitPrice: Number(product.price),
          quantity,
        },
      ];
    });
    setProductId("");
    setQuantity(1);
  }

  async function handleSubmit() {
    if (draft.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await createAddendum(
        parentOrderId,
        draft.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
        reason,
      );
      onCreated(res.order_id);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear el pedido",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar lo que faltó"
      description="Se crea un pedido nuevo ligado a este. La mesa no se vuelve a ocupar."
      icon={PackagePlus}
      dismissible={!saving}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={btnSecondaryFlex}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || draft.length === 0}
            className={btnPrimaryFlex}
          >
            {saving
              ? "Creando…"
              : `Crear pedido${total > 0 ? ` · ${formatCurrency(total)}` : ""}`}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <Notification tone="error" message={error} />}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Producto o servicio
          </label>
          <ProductSearchCombobox
            products={catalog}
            value={productId}
            onChange={setProductId}
            placeholder="Busca en tu catálogo…"
            disabled={saving}
          />
          <div className="flex items-center gap-2">
            <TouchStepper
              value={quantity}
              onChange={setQuantity}
              min={1}
              disabled={saving || !productId}
            />
            <button
              type="button"
              onClick={addToDraft}
              disabled={saving || !productId}
              className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-border-soft/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Agregar a la lista
            </button>
          </div>
        </div>

        {draft.length > 0 && (
          <ul className="divide-y divide-border-soft rounded-xl border border-border">
            {draft.map((item) => (
              <li
                key={item.productId}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((c) =>
                        c.filter((i) => i.productId !== item.productId),
                      )
                    }
                    disabled={saving}
                    className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border-soft hover:text-foreground"
                    aria-label={`Quitar ${item.name}`}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <FormInput
          label="Motivo"
          optional
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej. se entregó y no se registró"
          disabled={saving}
        />
      </div>
    </FormSheet>
  );
}
