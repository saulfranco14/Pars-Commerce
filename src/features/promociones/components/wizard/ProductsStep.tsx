"use client";

import { useMemo, useState } from "react";
import { Search, Store } from "lucide-react";

import { FilterTabs } from "@/components/ui/FilterTabs";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";
import { ProductPickerGrid, type PickerMode } from "@/features/promociones/components/wizard/ProductPickerGrid";

import { OFFER_WIZARD_TITLE_ID } from "@/features/promociones/constants/offerWizard";
import { findTemplate, rankSuggestedItems } from "@/features/promociones/helpers/templateSuggestions";

import type { OfferWizardValues, PickerItem, PickerSubcatalog } from "@/features/promociones/interfaces/offerWizard";
import type { UseFormReturn } from "react-hook-form";

type Scope = "products" | "subcatalogs" | "all";

const HEADINGS: Record<OfferWizardValues["mechanic"], { title: string; subtitle: string }> = {
  percentage: { title: "¿A qué le aplica el descuento?", subtitle: "Elige productos, categorías completas o toda la tienda." },
  fixed_amount: { title: "¿A qué le aplica el descuento?", subtitle: "Elige productos, categorías completas o toda la tienda." },
  fixed_price: { title: "¿Qué tendrá precio especial?", subtitle: "Todos los elegidos tendrán el mismo precio." },
  nxm: { title: "¿Qué producto va al 2x1?", subtitle: "Elige uno; el cliente lo agrega en grupo desde la tienda." },
  bundle_price: { title: "¿Qué incluye el paquete?", subtitle: "Toca para agregar y ajusta cuántas piezas lleva cada uno." },
  event_badge: { title: "¿Qué productos destacas?", subtitle: "Llevarán la etiqueta en tu tienda. Puedes dejarlo vacío." },
};

const TYPE_TABS = [
  { value: "all", label: "Todo" },
  { value: "product", label: "Productos" },
  { value: "service", label: "Servicios" },
];

const SCOPE_TABS = [
  { value: "products", label: "Productos" },
  { value: "subcatalogs", label: "Categorías" },
  { value: "all", label: "Toda la tienda" },
];

export function ProductsStep({
  form,
  values,
  items,
  subcatalogs,
}: {
  form: UseFormReturn<OfferWizardValues>;
  values: OfferWizardValues;
  items: PickerItem[];
  subcatalogs: PickerSubcatalog[];
}) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const mechanic = values.mechanic;
  const scopeAllowed = mechanic === "percentage" || mechanic === "fixed_amount";
  const scope: Scope = values.appliesToAll ? "all" : values.productIds.length === 0 && values.subcatalogIds.length > 0 ? "subcatalogs" : "products";
  const [scopeView, setScopeView] = useState<Scope>(scope);
  const mode: PickerMode = mechanic === "bundle_price" ? "quantity" : mechanic === "nxm" ? "single" : "multi";
  const errors = form.formState.errors;
  const error = errors.productIds?.message ?? errors.packItems?.message ?? errors.packItems?.root?.message;

  const entries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = items.filter(
      (item) => (typeFilter === "all" || item.type === typeFilter) && (!needle || item.name.toLowerCase().includes(needle)),
    );
    return rankSuggestedItems(filtered, findTemplate(values.templateKey)?.keywords);
  }, [items, query, typeFilter, values.templateKey]);

  const selected = useMemo(() => {
    if (mode === "quantity") return new Map(values.packItems.map((item) => [item.product_id, item.quantity]));
    return new Map(values.productIds.map((id) => [id, 1]));
  }, [mode, values.packItems, values.productIds]);

  function change(itemId: string, quantity: number) {
    if (mode === "quantity") {
      const rest = values.packItems.filter((item) => item.product_id !== itemId);
      const next = quantity > 0 ? [...rest, { product_id: itemId, quantity }] : rest;
      form.setValue("packItems", next, { shouldValidate: true });
      return;
    }
    const next = mode === "single"
      ? (quantity > 0 ? [itemId] : [])
      : quantity > 0 ? [...values.productIds, itemId] : values.productIds.filter((id) => id !== itemId);
    form.setValue("productIds", next, { shouldValidate: true });
  }

  function changeScope(next: string) {
    setScopeView(next as Scope);
    form.setValue("appliesToAll", next === "all", { shouldValidate: true });
    if (next === "all") {
      form.setValue("productIds", []);
      form.setValue("subcatalogIds", [], { shouldValidate: true });
    }
    if (next === "subcatalogs") form.setValue("productIds", [], { shouldValidate: true });
    if (next === "products") form.setValue("subcatalogIds", [], { shouldValidate: true });
  }

  function toggleSubcatalog(id: string) {
    const next = values.subcatalogIds.includes(id) ? values.subcatalogIds.filter((value) => value !== id) : [...values.subcatalogIds, id];
    form.setValue("subcatalogIds", next, { shouldValidate: true });
  }

  const heading = HEADINGS[mechanic];
  const pieces = values.packItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-5">
      <WizardStepHeading titleId={OFFER_WIZARD_TITLE_ID} eyebrow="Productos" title={heading.title} subtitle={heading.subtitle} />

      {scopeAllowed ? (
        <FilterTabs tabs={SCOPE_TABS} activeValue={scopeView} onTabChange={changeScope} ariaLabel="A qué aplica" density="touch" />
      ) : null}

      {scopeAllowed && scopeView === "all" ? (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Store className="h-5 w-5" aria-hidden />
          </span>
          <p className="text-sm text-foreground">
            El descuento se aplicará a <strong>todo lo que vendes en línea</strong>, incluidos los productos que agregues después.
          </p>
        </div>
      ) : scopeAllowed && scopeView === "subcatalogs" ? (
        subcatalogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no tienes categorías. Créalas en Productos para usarlas aquí.</p>
        ) : (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías">
            {subcatalogs.map((subcatalog) => {
              const active = values.subcatalogIds.includes(subcatalog.id);
              return (
                <button
                  key={subcatalog.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSubcatalog(subcatalog.id)}
                  className={`min-h-11 cursor-pointer rounded-full border px-4 text-sm font-semibold transition-colors ${
                    active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-foreground hover:border-accent/40"
                  }`}
                >
                  {subcatalog.name}
                </button>
              );
            })}
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-accent">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span className="sr-only">Buscar</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre"
                className="min-w-0 flex-1 bg-transparent text-base outline-none"
              />
            </label>
            <FilterTabs tabs={TYPE_TABS} activeValue={typeFilter} onTabChange={setTypeFilter} ariaLabel="Tipo" />
          </div>
          <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
            {mode === "quantity"
              ? `${pieces} ${pieces === 1 ? "pieza" : "piezas"} en el paquete`
              : `${values.productIds.length} ${values.productIds.length === 1 ? "elegido" : "elegidos"}`}
          </p>
          {entries.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No hay productos públicos con ese nombre.
            </p>
          ) : (
            <ProductPickerGrid entries={entries} mode={mode} selected={selected} onChange={change} />
          )}
        </>
      )}

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
