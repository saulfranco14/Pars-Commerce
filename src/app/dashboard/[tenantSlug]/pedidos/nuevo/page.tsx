"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import { useActiveTenant } from "@/stores/useTenantStore";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { FilterPills } from "@/components/admin/FilterPills";
import { FormInput } from "@/components/ui/FormInput";
import { MenuProductCard } from "@/features/qr/components/menu-product/MenuProductCard";
import { StaffOrderQrResult } from "@/features/qr/components/qr-create/StaffOrderQrResult";
import { useStaffOrderBuilder } from "@/features/qr/hooks/useStaffOrderBuilder";
import { listByTenant } from "@/services/productsService";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { ProductListItem } from "@/types/products";

const primaryCta =
  "inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-60";

export default function NuevoPedidoStaffPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const searchParams = useSearchParams();
  const tableOrderId = searchParams.get("table_order_id") ?? undefined;
  const activeTenant = useActiveTenant();
  const tenantId = activeTenant?.id ?? null;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const { data: products, isLoading } = useSWR<ProductListItem[]>(
    tenantId ? ["staff-order-products", tenantId] : null,
    () => listByTenant(tenantId as string),
  );

  const builder = useStaffOrderBuilder({
    tenantId: tenantId ?? "",
    tableOrderId,
  });

  // Category pills derived from the products' subcatalogs (same pattern as the
  // customer menu / products page).
  const categoryFilters = useMemo(() => {
    const byId = new Map<string, string>();
    for (const p of products ?? []) {
      if (p.subcatalog?.id && p.subcatalog.name) {
        byId.set(p.subcatalog.id, p.subcatalog.name);
      }
    }
    return [
      { value: "all", label: "Todos" },
      ...Array.from(byId, ([value, label]) => ({ value, label })),
    ];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (category !== "all") {
      list = list.filter((p) => p.subcatalog_id === category);
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  }, [products, query, category]);

  // MenuProductCard reports a productId; the builder wants the full product.
  const productById = useMemo(
    () => new Map((products ?? []).map((p) => [p.id, p] as const)),
    [products],
  );
  const { add } = builder;
  const addById = useCallback(
    (productId: string) => {
      const product = productById.get(productId);
      if (product) add(product);
    },
    [productById, add],
  );

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  // After confirm → show the QR / linked notice. The result component owns its
  // own "Pedido creado" heading — no PageHeader on top (it read duplicated).
  if (builder.result) {
    return (
      <StaffOrderQrResult
        total={builder.result.total}
        qrToken={builder.result.qr_token}
        customerName={builder.customerName || undefined}
        businessName={activeTenant.name}
        onNewOrder={builder.reset}
      />
    );
  }

  return (
    <div className="space-y-5 pb-40">
      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/${tenantSlug}/mesas`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground hover:bg-border-soft/40"
          aria-label="Volver"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title="Tomar pedido"
          description={
            tableOrderId
              ? "Se agregará a la cuenta de la mesa."
              : "Se generará un código QR para que el cliente pague."
          }
        />
      </div>

      {/* Customer name (optional) — icon + FormInput so it doesn't read as
          a second search box next to the product search below. */}
      <FormInput
        label="Cliente"
        icon={User}
        optional
        value={builder.customerName}
        onChange={(e) => builder.setCustomerName(e.target.value)}
        placeholder="Nombre del cliente"
      />

      {/* Product search — visually its own section (eyebrow + divider) so
          it doesn't blend into the customer-name field above it. */}
      <div className="border-t border-border-soft pt-4">
        <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Productos
        </span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar producto..."
            className="block w-full rounded-2xl border-2 border-border bg-background py-3 pl-11 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Category pills — only when there's more than one real category */}
      {categoryFilters.length > 2 && (
        <FilterPills
          filters={categoryFilters}
          value={category}
          onChange={setCategory}
          ariaLabel="Filtrar por categoría"
        />
      )}

      {/* Product list — the SAME card the customer menu uses (MenuProductCard):
          photo-led, price anchored, floating + / stepper. One visual language. */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Sin productos"
          description="No hay productos que coincidan con tu búsqueda."
        />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {filtered.map((product) => (
            <MenuProductCard
              key={product.id}
              product={product}
              quantity={builder.qtyByProduct[product.id] ?? 0}
              onAdd={addById}
              onDecrement={builder.decrement}
              tenantLogoUrl={activeTenant.logo_url}
              tenantName={activeTenant.name}
            />
          ))}
        </div>
      )}

      {/* Fixed summary + confirm bar */}
      {builder.itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl space-y-2 px-4 py-3">
            <div className="max-h-24 space-y-1 overflow-y-auto">
              {builder.lines.map((l) => (
                <div
                  key={l.product.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">
                    {l.quantity}× {l.product.name}
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(Number(l.product.price) * l.quantity)}
                  </span>
                </div>
              ))}
            </div>
            {builder.error && (
              <p className="text-xs font-medium text-red-600">{builder.error}</p>
            )}
            <button
              type="button"
              onClick={builder.submit}
              disabled={builder.submitting}
              className={primaryCta}
            >
              {builder.submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creando pedido...
                </>
              ) : (
                <>
                  Confirmar pedido · {formatCurrency(builder.total)}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
