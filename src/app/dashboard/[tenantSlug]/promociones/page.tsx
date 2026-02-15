"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { swrFetcher } from "@/lib/swrFetcher";
import type { Promotion, CreatePromotionPayload } from "@/services/promotionsService";
import {
  list as listPromotions,
  create as createPromotion,
  remove as removePromotion,
} from "@/services/promotionsService";

const promotionsKey = (tenantId: string) =>
  `/api/promotions?tenant_id=${encodeURIComponent(tenantId)}`;

export default function PromocionesPage() {
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"percentage" | "fixed_amount">("percentage");
  const [value, setValue] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);

  const key = activeTenant ? promotionsKey(activeTenant.id) : null;
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

      await createPromotion(payload);
      setName("");
      setValue("");
      setMinAmount("");
      setValidFrom("");
      setValidUntil("");
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
    const desc =
      p.type === "percentage"
        ? `${val}% de descuento`
        : `$${val.toFixed(2)} de descuento`;
    const min = p.min_amount ? ` Compra mínima $${Number(p.min_amount).toFixed(2)}.` : "";
    const until = p.valid_until
      ? ` Válida hasta ${new Date(p.valid_until).toLocaleDateString("es-MX")}.`
      : "";
    return `${desc}.${min}${until}`;
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground">
                Tipo
              </label>
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "percentage" | "fixed_amount")
                }
                className="input-form mt-1 block w-full min-h-[40px] rounded-lg border px-3 py-2 text-sm"
              >
                <option value="percentage">Porcentaje</option>
                <option value="fixed_amount">Monto fijo</option>
              </select>
            </div>
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
              className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface-raised p-4"
            >
              <div>
                <p className="font-medium text-foreground">{p.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPromotion(p)}
                </p>
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
