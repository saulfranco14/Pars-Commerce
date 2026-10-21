"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import { ProductPickerGrid } from "@/features/promociones/components/wizard/ProductPickerGrid";

import { formatCurrency } from "@/features/qr/helpers/format";
import { PLAN_WIZARD_TITLE_ID } from "@/features/planes/constants/planWizard";
import { findTemplate, rankSuggestedItems } from "@/features/promociones/helpers/templateSuggestions";

import type { PickerItem } from "@/features/promociones/interfaces/offerWizard";
import type { PlanWizardValues } from "@/features/planes/interfaces/planWizard";
import type { UseFormReturn } from "react-hook-form";

export function PlanItemsStep({
  form,
  values,
  products,
  listValue,
}: {
  form: UseFormReturn<PlanWizardValues>;
  values: PlanWizardValues;
  products: PickerItem[];
  listValue: number;
}) {
  const [query, setQuery] = useState("");
  const error = form.formState.errors.items?.message ?? form.formState.errors.items?.root?.message;

  const entries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle ? products.filter((item) => item.name.toLowerCase().includes(needle)) : products;
    return rankSuggestedItems(filtered, findTemplate(values.templateKey)?.keywords);
  }, [products, query, values.templateKey]);

  const selected = useMemo(() => new Map(values.items.map((item) => [item.product_id, item.quantity])), [values.items]);
  const pieces = values.items.reduce((sum, item) => sum + item.quantity, 0);

  function change(productId: string, quantity: number) {
    const rest = values.items.filter((item) => item.product_id !== productId);
    form.setValue("items", quantity > 0 ? [...rest, { product_id: productId, quantity }] : rest, { shouldValidate: true });
  }

  return (
    <div className="space-y-5">
      <WizardStepHeading
        titleId={PLAN_WIZARD_TITLE_ID}
        eyebrow="Qué incluye"
        title="¿Qué recibe tu cliente cada periodo?"
        subtitle="Toca para agregar y ajusta cuántas piezas lleva cada producto."
      />

      <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-accent">
        <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="sr-only">Buscar productos</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar productos"
          className="w-full bg-transparent text-base outline-none"
        />
      </label>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Aún no tienes productos públicos. Agrégalos en Productos para armar el plan.
        </p>
      ) : (
        <ProductPickerGrid entries={entries} mode="quantity" selected={selected} onChange={change} />
      )}

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      {pieces > 0 ? (
        <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
          <span className="text-sm text-muted-foreground">
            {values.items.length} {values.items.length === 1 ? "producto" : "productos"} · {pieces} {pieces === 1 ? "pieza" : "piezas"}
          </span>
          <span className="text-sm font-semibold text-foreground">Valor normal {formatCurrency(listValue)}</span>
        </div>
      ) : null}
    </div>
  );
}
