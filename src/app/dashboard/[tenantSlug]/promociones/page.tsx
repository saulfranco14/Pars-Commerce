"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ImageUpload } from "@/components/ImageUpload";
import { swrFetcher } from "@/lib/swrFetcher";
import type { Promotion, CreatePromotionPayload, PromotionType } from "@/services/promotionsService";
import {
  create as createPromotion,
  remove as removePromotion,
} from "@/services/promotionsService";

const promotionsKey = (tenantId: string) =>
  `/api/promotions?tenant_id=${encodeURIComponent(tenantId)}`;

const productsKey = (tenantId: string) =>
  `/api/products?tenant_id=${encodeURIComponent(tenantId)}`;

const subcatalogsKey = (tenantId: string) =>
  `/api/subcatalogs?tenant_id=${encodeURIComponent(tenantId)}`;

interface ProductItem {
  id: string;
  name: string;
  slug: string | null;
}

interface SubcatalogItem {
  id: string;
  name: string;
  slug: string;
}

export default function PromocionesPage() {
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<PromotionType>("percentage");
  const [value, setValue] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [description, setDescription] = useState("");
  const [badgeLabel, setBadgeLabel] = useState("");
  const [quantity, setQuantity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedSubcatalogIds, setSelectedSubcatalogIds] = useState<string[]>([]);

  const key = activeTenant ? promotionsKey(activeTenant.id) : null;
  const productsKeyValue = activeTenant ? productsKey(activeTenant.id) : null;
  const subcatalogsKeyValue = activeTenant ? subcatalogsKey(activeTenant.id) : null;
  const { data: productsData } = useSWR<ProductItem[]>(productsKeyValue, swrFetcher, { fallbackData: [] });
  const { data: subcatalogsData } = useSWR<SubcatalogItem[]>(subcatalogsKeyValue, swrFetcher, { fallbackData: [] });
  const products = Array.isArray(productsData) ? productsData : [];
  const subcatalogs = Array.isArray(subcatalogsData) ? subcatalogsData : [];
  const { data: promotionsData, error: swrError, isLoading, mutate } = useSWR<Promotion[]>(
    key,
    swrFetcher,
    { fallbackData: [] }
  );
  const promotions = Array.isArray(promotionsData) ? promotionsData : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTenant) return;
    setError(null);
    setLoading(true);
    try {
      const payload: CreatePromotionPayload = {
        tenant_id: activeTenant.id,
        name: name.trim(),
        type,
        value: parseFloat(value) || 0,
      };
      if (minAmount.trim()) payload.min_amount = parseFloat(minAmount);
      if (validFrom.trim()) payload.valid_from = validFrom;
      if (validUntil.trim()) payload.valid_until = validUntil;
      if (type === "bundle_price") {
        if (selectedProductIds.length > 0) payload.bundle_product_ids = selectedProductIds;
        if (quantity.trim()) payload.quantity = parseInt(quantity, 10);
      } else if (selectedProductIds.length > 0) {
        payload.product_ids = selectedProductIds;
      }
      if (imageUrl.trim()) payload.image_url = imageUrl.trim();
      if (description.trim()) payload.description = description.trim();
      if (badgeLabel.trim()) payload.badge_label = badgeLabel.trim();
      if (selectedSubcatalogIds.length > 0) payload.subcatalog_ids = selectedSubcatalogIds;

      await createPromotion(payload);
      setName("");
      setValue("");
      setMinAmount("");
      setValidFrom("");
      setValidUntil("");
      setDescription("");
      setBadgeLabel("");
      setQuantity("");
      setImageUrl("");
      setSelectedProductIds([]);
      setSelectedSubcatalogIds([]);
      setShowForm(false);
      await mutate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!promotionToDelete) return;
    setDeletingId(promotionToDelete.id);
    setError(null);
    try {
      await removePromotion(promotionToDelete.id);
      setPromotionToDelete(null);
      await mutate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  function formatPromotion(p: Promotion): string {
    const val = Number(p.value);
    let desc = "";
    if (p.type === "percentage") desc = `${val}% de descuento`;
    else if (p.type === "fixed_amount") desc = `$${val.toFixed(2)} de descuento`;
    else if (p.type === "bundle_price") desc = p.quantity ? `${p.quantity} por $${val.toFixed(2)}` : `$${val.toFixed(2)}`;
    else if (p.type === "fixed_price") desc = `Precio especial $${val.toFixed(2)}`;
    else if (p.type === "event_badge") desc = p.badge_label || "Promoción";
    else desc = `$${val.toFixed(2)}`;
    const min = p.min_amount ? ` Compra mínima $${Number(p.min_amount).toFixed(2)}.` : "";
    const until = p.valid_until
      ? ` Válida hasta ${new Date(p.valid_until).toLocaleDateString("es-MX")}.`
      : "";
    return `${desc}.${min}${until}`;
  }

  function isExpired(p: Promotion): boolean {
    if (!p.valid_until) return false;
    const until = new Date(p.valid_until);
    return until < new Date();
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="space-y-4 px-2 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Promociones</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          {showForm ? "Cancelar" : "Nueva promoción"}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-border bg-surface-raised p-4 space-y-4"
        >
          <h2 className="text-sm font-medium text-foreground">Crear promoción</h2>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm"
              placeholder="Ej. 20% en regalos"
            />
          </div>
          {activeTenant && (
            <ImageUpload
              tenantId={activeTenant.id}
              variant="promotion"
              currentUrl={imageUrl || null}
              onUploaded={setImageUrl}
              disabled={loading}
              label="Imagen de la promoción (opcional)"
            />
          )}
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input-form mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Detalles y condiciones de la promoción"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PromotionType)}
                className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm"
              >
                <option value="percentage">Porcentaje</option>
                <option value="fixed_amount">Monto fijo</option>
                <option value="bundle_price">X por $Y (pack)</option>
                <option value="fixed_price">Precio especial</option>
                <option value="event_badge">Etiqueta de evento</option>
              </select>
            </div>
            {type !== "event_badge" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Valor {type === "percentage" ? "(%)" : "($)"}
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  min={0}
                  step={type === "percentage" ? 1 : 0.01}
                  className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            )}
            {type === "event_badge" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Etiqueta (ej. BUEN-FIN)
                </label>
                <input
                  type="text"
                  value={badgeLabel}
                  onChange={(e) => setBadgeLabel(e.target.value)}
                  className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm"
                  placeholder="Ej. BUEN-FIN"
                />
              </div>
            )}
            {type === "bundle_price" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Cantidad (ej. 6 en 6 por $85)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={1}
                  className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm"
                  placeholder="6"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Mínimo de compra (opcional)
            </label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              min={0}
              step={0.01}
              className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm"
              placeholder="0"
            />
          </div>
          {(type === "bundle_price" || type === "fixed_price" || type === "percentage" || type === "fixed_amount") && (
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Productos aplicables (opcional)
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {type === "bundle_price" ? "Productos del pack. " : ""}
              Deja vacío para aplicar a todos. Selecciona para limitar la promoción.
            </p>
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
              {products.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin productos</p>
              ) : (
                products.map((prod) => (
                  <label
                    key={prod.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-border-soft"
                  >
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(prod.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProductIds((prev) => [...prev, prod.id]);
                        } else {
                          setSelectedProductIds((prev) => prev.filter((id) => id !== prod.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="text-sm">{prod.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          )}
          {subcatalogs.length > 0 && type !== "event_badge" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Subcatálogos aplicables (opcional)
              </label>
              <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                {subcatalogs.map((sc) => (
                  <label
                    key={sc.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-border-soft"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubcatalogIds.includes(sc.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubcatalogIds((prev) => [...prev, sc.id]);
                        } else {
                          setSelectedSubcatalogIds((prev) => prev.filter((id) => id !== sc.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span className="text-sm">{sc.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Vigencia desde (opcional)
              </label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Vigencia hasta (opcional)
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear promoción"}
          </button>
        </form>
      )}

      {isLoading ? (
        <LoadingBlock />
      ) : promotions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay promociones. Crea una para ofrecer descuentos en tu tienda.
        </p>
      ) : (
        <ul className="space-y-2">
          {promotions.map((p) => (
            <li
              key={p.id}
              className={`flex items-start justify-between gap-4 rounded-lg border border-border bg-surface-raised p-4 ${isExpired(p) ? "opacity-75" : ""}`}
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground">{p.name}</p>
                  {isExpired(p) && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Expirada
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPromotion(p)}
                </p>
                {isExpired(p) && (
                  <p className="mt-1 text-xs text-amber-600">
                    Esta promoción ya expiró y no se mostrará en tu sitio.
                  </p>
                )}
                {((p.product_ids?.length ?? 0) + (p.bundle_product_ids?.length ?? 0)) > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {((p.product_ids?.length ?? 0) + (p.bundle_product_ids?.length ?? 0))} producto{((p.product_ids?.length ?? 0) + (p.bundle_product_ids?.length ?? 0)) !== 1 ? "s" : ""} aplicable{((p.product_ids?.length ?? 0) + (p.bundle_product_ids?.length ?? 0)) !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPromotionToDelete(p)}
                className="shrink-0 rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                aria-label="Eliminar"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!promotionToDelete}
        onClose={() => setPromotionToDelete(null)}
        title="Eliminar promoción"
        message={`¿Eliminar la promoción "${promotionToDelete?.name}"?`}
        onConfirm={handleDeleteConfirm}
        loading={!!deletingId}
      />
      </div>
    </div>
  );
}
