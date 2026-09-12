"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { Loader2, ShoppingBag, Timer } from "lucide-react";

import { EmptyState } from "@/components/admin/EmptyState";
import { BrandImage } from "@/features/qr/components/BrandImage";
import { OrdersClosedNotice } from "@/features/checkout/components/cart/OrdersClosedNotice";
import { KioskAttractScreen } from "@/features/dispositivos/components/kiosk/KioskAttractScreen";
import { KioskCartBar } from "@/features/dispositivos/components/kiosk/KioskCartBar";
import { KioskCartPanel } from "@/features/dispositivos/components/kiosk/KioskCartPanel";
import { KioskCategoryRail } from "@/features/dispositivos/components/kiosk/KioskCategoryRail";
import { KioskProductDialog } from "@/features/dispositivos/components/kiosk/KioskProductDialog";
import { KioskProductTile } from "@/features/dispositivos/components/kiosk/KioskProductTile";
import { KioskScreenShell } from "@/features/dispositivos/components/kiosk/KioskScreenShell";
import { KioskTicketScreen } from "@/features/dispositivos/components/KioskTicketScreen";
import { useIdleReset } from "@/features/dispositivos/hooks/useIdleReset";
import { useKioskCart } from "@/features/dispositivos/hooks/useKioskCart";
import { createKioskOrder } from "@/features/dispositivos/services/kioskClientService";
import { DEFAULT_IDLE_RESET_SECONDS } from "@/features/dispositivos/constants/kiosk";
import { swrFetcher } from "@/lib/swrFetcher";

import type { KioskCatalog } from "@/features/dispositivos/interfaces/kiosk";
import type { MenuItem } from "@/features/qr/interfaces/tableCart";

interface Ticket {
  orderNumber: string;
  qrToken: string;
  total: number;
  scheduledFor: string | null;
}

export function KioskOrderScreen() {
  const [started, setStarted] = useState(false);
  const [category, setCategory] = useState("all");
  const [detail, setDetail] = useState<MenuItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useSWR<KioskCatalog>(
    "/api/kiosk/catalog",
    swrFetcher,
  );

  // Memoizado: el `[]` del caso vacío sería un array nuevo en cada render.
  const products = useMemo(() => data?.products ?? [], [data]);
  const categories = useMemo(() => data?.categories ?? [], [data]);
  const cart = useKioskCart(products);

  const reset = useCallback(() => {
    cart.clear();
    setStarted(false);
    setCategory("all");
    setDetail(null);
    setCartOpen(false);
    setScheduledFor("");
    setTicket(null);
    setError(null);
  }, [cart]);

  // El reloj corre solo mientras el cliente arma su pedido: en la portada no hay
  // nada que borrar y en el ticket el cliente lo está fotografiando.
  const { secondsLeft } = useIdleReset(
    data?.idleResetSeconds ?? DEFAULT_IDLE_RESET_SECONDS,
    reset,
    started && ticket === null,
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: products.length };
    for (const p of products) {
      if (p.subcatalog_id) {
        map[p.subcatalog_id] = (map[p.subcatalog_id] ?? 0) + 1;
      }
    }
    return map;
  }, [products]);

  const shown = useMemo(
    () =>
      category === "all"
        ? products
        : products.filter((p) => p.subcatalog_id === category),
    [products, category],
  );

  async function confirm() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await createKioskOrder(
        cart.lines.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
        })),
        scheduledFor || null,
      );
      setTicket({
        orderNumber: res.order_number,
        qrToken: res.qr_token,
        total: res.total,
        scheduledFor: scheduledFor || null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar el pedido",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <KioskScreenShell
        icon={Loader2}
        spin
        title="Preparando el menú"
        description="Un momento."
      />
    );
  }

  if (ticket) {
    return <KioskTicketScreen {...ticket} onDone={reset} />;
  }

  if (data && !data.acceptingOrders) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <div className="max-w-lg">
          <OrdersClosedNotice businessName={data.tenantName} />
        </div>
      </div>
    );
  }

  const tenantName = data?.tenantName ?? "";
  const tenantLogoUrl = data?.tenantLogoUrl ?? null;

  if (!started) {
    return (
      <KioskAttractScreen
        tenantName={tenantName}
        tenantLogoUrl={tenantLogoUrl}
        products={products}
        onStart={() => setStarted(true)}
      />
    );
  }

  const cartPanel = data ? (
    <KioskCartPanel
      lines={cart.lines}
      total={cart.total}
      itemCount={cart.itemCount}
      onAdd={cart.add}
      onDecrement={cart.decrement}
      onRemove={cart.removeLine}
      onClear={cart.clear}
      onConfirm={confirm}
      submitting={submitting}
      error={error}
      pickupScheduling={data.pickupScheduling}
      businessHours={data.businessHours}
      scheduledFor={scheduledFor}
      onScheduleChange={setScheduledFor}
    />
  ) : null;

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-4 border-b border-border bg-surface px-6 py-4">
          <BrandImage
            src={tenantLogoUrl}
            name={tenantName}
            alt={tenantName}
            className="h-14 w-14 shrink-0"
            rounded="rounded-2xl"
            sizes="56px"
            priority
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-3xl font-bold tracking-tight text-foreground">
              {tenantName}
            </h1>
            <p className="text-base text-muted-foreground">
              Elige lo que quieras y paga al final
            </p>
          </div>
          {secondsLeft !== null && (
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-amber-100 px-5 py-2 text-base font-semibold text-amber-800">
              <Timer className="h-5 w-5 shrink-0" aria-hidden />
              Se reinicia en {secondsLeft}s
            </span>
          )}
        </header>

        {categories.length > 0 && (
          <div className="shrink-0 border-b border-border bg-surface px-6 py-3">
            <KioskCategoryRail
              categories={categories}
              activeId={category}
              onSelect={setCategory}
              counts={counts}
              tenantLogoUrl={tenantLogoUrl}
              tenantName={tenantName}
            />
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {shown.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Sin productos"
              description="Este negocio todavía no tiene productos disponibles."
            />
          ) : (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-3 2xl:grid-cols-4">
              {shown.map((product) => (
                <KioskProductTile
                  key={product.id}
                  product={product}
                  quantity={cart.quantities[product.id] ?? 0}
                  onOpen={setDetail}
                  onAdd={cart.add}
                />
              ))}
            </div>
          )}
        </div>

        {/* Vertical: cajón que sube desde la barra. En pantalla ancha el pedido
            ya vive en la columna de la derecha, así que aquí no se repite. */}
        <div className="shrink-0 xl:hidden">
          {/* Columna flex con techo: con pocos productos el cajón mide lo que
              mide su contenido, y al pasarse la lista scrollea con el total y el
              botón anclados abajo. */}
          {cartOpen && cart.itemCount > 0 && (
            <div className="flex max-h-[55dvh] flex-col border-t border-border bg-surface">
              {cartPanel}
            </div>
          )}
          <KioskCartBar
            itemCount={cart.itemCount}
            total={cart.total}
            expanded={cartOpen}
            onToggle={() => setCartOpen((v) => !v)}
          />
        </div>
      </div>

      <aside className="hidden w-104 shrink-0 flex-col border-l border-border bg-surface xl:flex">
        {cartPanel}
      </aside>

      <KioskProductDialog
        product={detail}
        isOpen={detail !== null}
        onClose={() => setDetail(null)}
        inCartQuantity={detail ? (cart.quantities[detail.id] ?? 0) : 0}
        onAdd={cart.add}
        tenantLogoUrl={tenantLogoUrl}
      />
    </div>
  );
}
