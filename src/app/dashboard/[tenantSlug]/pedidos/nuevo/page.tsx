"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, Loader2, Lock, Search, ShoppingBag, User, Users } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import { useActiveTenant, usePermission } from "@/stores/useTenantStore";
import { EmptyState } from "@/components/admin/EmptyState";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { FormInput } from "@/components/ui/FormInput";
import { MenuProductCard } from "@/features/qr/components/menu-product/MenuProductCard";
import { StaffOrderCartPanel } from "@/features/qr/components/menu-product/StaffOrderCartPanel";
import { StaffOrderQrResult } from "@/features/qr/components/qr-create/StaffOrderQrResult";
import { useStaffOrderBuilder } from "@/features/qr/hooks/useStaffOrderBuilder";
import { listByTenant } from "@/services/productsService";
import { swrFetcher } from "@/lib/swrFetcher";

import type { ProductListItem } from "@/types/products";
import type { AdminViewResponse } from "@/features/qr/services/tableAdminViewService";

export default function NuevoPedidoStaffPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const searchParams = useSearchParams();
  const tableOrderId = searchParams.get("table_order_id") ?? undefined;
  const activeTenant = useActiveTenant();
  const can = usePermission();
  const tenantId = activeTenant?.id ?? null;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [recipientOpen, setRecipientOpen] = useState(true);

  const { data: products, isLoading } = useSWR<ProductListItem[]>(
    tenantId ? ["staff-order-products", tenantId] : null,
    () => listByTenant(tenantId as string),
  );
  const { data: tableView, isLoading: tableLoading } = useSWR<AdminViewResponse>(
    tableOrderId ? `/api/qr/table/${encodeURIComponent(tableOrderId)}/admin-view` : null,
    swrFetcher,
  );

  const builder = useStaffOrderBuilder({
    tenantId: tenantId ?? "",
    tableOrderId,
  });

  useEffect(() => {
    if (!tableOrderId || !builder.result?.linked_to_table) return;
    const timer = window.setTimeout(() => {
      router.replace(`/dashboard/${tenantSlug}/mesas/${tableOrderId}`);
    }, 1_400);
    return () => window.clearTimeout(timer);
  }, [builder.result?.linked_to_table, router, tableOrderId, tenantSlug]);

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

  const productById = useMemo(
    () => new Map((products ?? []).map((p) => [p.id, p] as const)),
    [products],
  );
  const { add } = builder;
  const tableDevices = tableView?.devices ?? [];
  const tableLabel = tableView?.order?.table_label ?? "Mesa";
  const selectedDevice = tableDevices.find(
    (device) => device.id === builder.assignedDeviceId,
  );
  const selectedRecipient = selectedDevice?.display_name?.trim() || "Toda la mesa";
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

  // Checked here too, not just on the endpoint: otherwise the whole order gets
  // built before the 403.
  if (!can(ORDER_PERMISSIONS.take)) {
    return (
      <EmptyState
        icon={Lock}
        title="Tu rol no puede levantar pedidos"
        description="Pide a la persona dueña del negocio que te asigne un rol con permiso para tomar pedidos."
      />
    );
  }

  if (builder.result) {
    return (
      <StaffOrderQrResult
        total={builder.result.total}
        qrToken={builder.result.qr_token}
        customerName={builder.customerName || undefined}
        businessName={activeTenant.name}
        tableLabel={tableOrderId ? tableLabel : undefined}
        returnToTableHref={
          tableOrderId
            ? `/dashboard/${tenantSlug}/mesas/${tableOrderId}`
            : undefined
        }
        onNewOrder={builder.reset}
      />
    );
  }

  return (
    // Subtracts the dashboard chrome: h-14 header + main's vertical padding.
    <div className="flex h-[calc(100dvh-6rem)] min-h-0 flex-col overflow-hidden sm:h-[calc(100dvh-6.5rem)]">
      <div className="shrink-0 space-y-3 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/${tenantSlug}/mesas`}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground transition-colors hover:bg-border-soft/40"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground">
              Tomar pedido
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {tableOrderId
                ? `${tableLabel} · ${tableDevices.length} usuario${tableDevices.length === 1 ? "" : "s"} conectado${tableDevices.length === 1 ? "" : "s"}`
                : "Se generará un código QR para que el cliente pague."}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {tableOrderId ? (
            <section className="rounded-2xl border border-border bg-surface p-3 sm:col-span-2">
              {!recipientOpen && (
                <button
                  type="button"
                  onClick={() => setRecipientOpen(true)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl px-1 text-left transition-colors hover:bg-border-soft/35"
                  aria-expanded={false}
                >
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Agregar para</span>
                    <span className="block truncate text-sm font-semibold text-foreground">{selectedRecipient}</span>
                  </span>
                  <span className="text-xs font-semibold text-accent">Cambiar</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              )}
              {recipientOpen && (
                <>
                <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">¿Para quién es este pedido?</h2>
                  <p className="text-xs text-muted-foreground">Elige a la persona para que reciba sus productos.</p>
                </div>
              </div>
              {tableLoading ? (
                <div className="mt-3 flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Cargando usuarios de la mesa…
                </div>
              ) : tableDevices.length === 0 ? (
                <p className="mt-3 rounded-xl bg-border-soft/45 px-3 py-2.5 text-sm text-muted-foreground">
                  Aún no hay usuarios conectados. El pedido se agregará para toda la mesa.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      builder.setAssignedDeviceId(undefined);
                      setRecipientOpen(false);
                    }}
                    aria-pressed={!builder.assignedDeviceId}
                    className={`flex min-h-12 w-full items-center rounded-xl border px-3 text-left text-sm font-semibold transition-colors ${
                      !builder.assignedDeviceId
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border bg-background text-foreground hover:bg-border-soft/35"
                    }`}
                  >
                    Para toda la mesa
                  </button>
                  {tableDevices.map((device, index) => {
                    const name = device.display_name?.trim() || `Cliente ${index + 1}`;
                    const initials = name
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")
                      .toUpperCase();
                    const selected = builder.assignedDeviceId === device.id;
                    return (
                      <button
                        key={device.id}
                        type="button"
                        onClick={() => {
                          builder.setAssignedDeviceId(device.id);
                          setRecipientOpen(false);
                        }}
                        aria-pressed={selected}
                        className={`flex min-h-12 w-full items-center gap-2 rounded-xl border px-3 text-left text-sm font-semibold transition-colors ${
                          selected
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-background text-foreground hover:bg-border-soft/35"
                        }`}
                      >
                        <span
                          aria-hidden
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: device.color_hex }}
                        >
                          {initials}
                        </span>
                        <span className="truncate">{name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
                </>
              )}
            </section>
          ) : (
            <FormInput
              label="Cliente"
              icon={User}
              optional
              value={builder.customerName}
              onChange={(e) => builder.setCustomerName(e.target.value)}
              placeholder="Nombre del cliente"
            />
          )}
          <div>
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Buscar
            </span>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nombre del producto…"
                className="block min-h-12 w-full rounded-2xl border-2 border-border bg-background py-3 pl-11 pr-4 text-base font-medium text-foreground transition-colors placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
                aria-label="Buscar producto"
              />
            </div>
          </div>
        </div>

        {categoryFilters.length > 2 && (
          <FilterTabs
            tabs={categoryFilters}
            activeValue={category}
            onTabChange={setCategory}
            ariaLabel="Filtrar por categoría"
            density="touch"
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Sin productos"
            description="No hay productos que coincidan con tu búsqueda."
          />
        ) : (
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((product) => (
              <MenuProductCard
                key={product.id}
                product={product}
                quantity={builder.qtyByProduct[product.id] ?? 0}
                onAdd={addById}
                onDecrement={builder.decrement}
                tenantLogoUrl={activeTenant.logo_url}
                tenantName={activeTenant.name}
                density="touch"
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0">
        <StaffOrderCartPanel
          lines={builder.lines}
          total={builder.total}
          itemCount={builder.itemCount}
          onAdd={addById}
          onDecrement={builder.decrement}
          onSubmit={builder.submit}
          submitting={builder.submitting}
          error={builder.error}
          appendingToTable={!!tableOrderId}
        />
      </div>
    </div>
  );
}
