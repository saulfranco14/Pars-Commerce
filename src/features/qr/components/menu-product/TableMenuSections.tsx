"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, PanelTopClose, Search, Tag, X } from "lucide-react";

import { BrandImage } from "@/features/qr/components/BrandImage";
import { MenuPeekRow } from "@/features/qr/components/menu-product/MenuPeekRow";
import { MenuProductCard } from "@/features/qr/components/menu-product/MenuProductCard";
import { PromoBanner } from "@/features/qr/components/PromoBanner";
import { ReorderRow } from "@/features/qr/components/menu-product/ReorderRow";
import { ProductDetailSheet } from "@/features/qr/components/menu-product/ProductDetailSheet";
import { sectionThumbnail } from "@/features/qr/helpers/sectionThumbnail";
import { useMenuSections } from "@/features/qr/hooks/useMenuSections";
import { bestUnitPromotion } from "@/lib/offers/pricing";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";
import type { QrPromotion } from "@/features/qr/interfaces/promotion";
import type {
  QrSessionCategory,
  QrSessionMenuItem,
} from "@/features/qr/interfaces/tableSession";

interface TableMenuSectionsProps {
  products: QrSessionMenuItem[];
  categories: QrSessionCategory[];
  onAdd: (productId: string) => void;
  onAddMany: (productId: string, qty: number) => void;
  onDecrement: (productId: string) => void;
  quantities: Record<string, number>;
  tenantLogoUrl?: string | null;
  tenantName?: string | null;
  /**
   * When true (the customer already sent an order), the whole menu starts
   * COLLAPSED behind a "¿Pedir algo más?" trigger — the Uber/Rappi pattern
   * where, once you've ordered, the menu stops competing with your order and
   * re-ordering becomes an intentional tap. Defaults to false (first visit).
   */
  startCollapsed?: boolean;
  /**
   * Products the table already ordered (most recent first) — feeds the
   * "Vuelve a pedir" rail in the collapsed state. The peek rail then shows
   * only products NOT ordered yet, so the two rails never repeat items.
   */
  reorderProducts?: QrSessionMenuItem[];
  /** Active promotions surfaced in one compact, scrollable offers rail. */
  promotions?: QrPromotion[];
  onAddPromotion?: (promotion: QrPromotion) => void;
  cartListTotal?: number;
}

/**
 * Menu grouped into category sections with sticky filter pills that scroll to
 * their section (UberEats/Rappi pattern). A search box collapses everything to
 * a flat filtered grid. When the tenant has no categories, it degrades to a
 * single plain grid with search.
 *
 * Presentational: grouping/search live in useMenuSections; add/remove are
 * delegated callbacks.
 */
export function TableMenuSections({
  products,
  categories,
  onAdd,
  onAddMany,
  onDecrement,
  quantities,
  tenantLogoUrl,
  tenantName,
  startCollapsed = false,
  reorderProducts,
  promotions,
  onAddPromotion,
  cartListTotal = 0,
}: TableMenuSectionsProps) {
  const { query, setQuery, searching, filtered, sections, totalCount } =
    useMenuSections({ products, categories });
  const activePromotions = promotions ?? [];

  // Peek rail = discovery: products NOT already ordered (the reorder rail owns
  // those). Falls back to the full menu if the table ordered everything.
  const peekProducts = useMemo(() => {
    if (!reorderProducts || reorderProducts.length === 0) return products;
    const ordered = new Set(reorderProducts.map((p) => p.id));
    const rest = products.filter((p) => !ordered.has(p.id));
    return rest.length > 0 ? rest : products;
  }, [products, reorderProducts]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MenuItem | null>(null);
  // Collapse decision is made ONCE, from the initial value of `startCollapsed`
  // (the caller derives it from the order that's known on first render). We do
  // NOT react to later changes: yanking the menu shut when the customer sends
  // their first batch mid-browse would be hostile. After mount, only the user
  // toggles it.
  const [expanded, setExpanded] = useState(!startCollapsed);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const showPills = sections.length > 1 && !searching && expanded;
  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeId) ?? sections[0] ?? null,
    [activeId, sections],
  );
  // Search is available whenever the menu is open and there's more than a
  // handful of products (a search box over 3 items is noise).
  const showSearch = totalCount >= 5 && expanded;
  const promotionalPrice = (product: QrSessionMenuItem) => {
    const best = bestUnitPromotion(promotions ?? [], {
      id: product.id,
      price: Number(product.price),
      subcatalog_id: product.subcatalog_id ?? null,
    }, new Date(), { channel: "onsite", onsitePromotionsEnabled: true, cartListSubtotal: cartListTotal });
    return best ? { price: best.finalPrice, name: promotions?.find((promotion) => promotion.id === best.promotionId)?.name ?? null } : null;
  };

  // Highlight the pill for the section currently at the top of the viewport.
  useEffect(() => {
    if (!showPills) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id.replace("sec-", ""));
      },
      { rootMargin: "-116px 0px -70% 0px", threshold: 0 },
    );
    for (const s of sections) {
      const node = sectionRefs.current[s.id];
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [showPills, sections]);

  function scrollTo(id: string) {
    const node = sectionRefs.current[id];
    if (!node) return;
    const top = node.getBoundingClientRect().top + window.scrollY - 112;
    window.scrollTo({ top, behavior: "smooth" });
  }

  if (products.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Este negocio aún no tiene productos disponibles.
      </p>
    );
  }

  return (
    <div>
      {/* Collapsed state (Rappi pattern): "Vuelve a pedir" first (repeat the
          last round in one tap), then a discovery rail of not-yet-ordered
          products. No lone button over empty space. */}
      {!expanded && (
        <div className="space-y-3">
          <MenuPeekRow
            products={peekProducts}
            onAdd={onAdd}
            onOpenDetail={setDetail}
            onExpand={() => setExpanded(true)}
            tenantLogoUrl={tenantLogoUrl}
            tenantName={tenantName}
          />
          {reorderProducts && reorderProducts.length > 0 && (
            <ReorderRow
              products={reorderProducts}
              onAdd={onAdd}
              onOpenDetail={setDetail}
              tenantLogoUrl={tenantLogoUrl}
              tenantName={tenantName}
            />
          )}
        </div>
      )}

      {!expanded ? null : (
      <>
      {/* Collapse header — only in post-order mode, so the customer can hide the
          menu again after peeking. First visit never shows this (menu is the
          whole point of the screen). */}
      {startCollapsed && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mb-3 flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 text-left shadow-sm transition-colors hover:border-accent/40 hover:bg-accent/5 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <span className="text-sm font-bold text-foreground">Menú</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            Volver a sugerencias
            <PanelTopClose className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </button>
      )}

      {/* Search */}
      {showSearch && (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            inputMode="search"
            placeholder="Buscar producto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full rounded-2xl border-2 border-border bg-background py-3 pl-11 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-accent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Promotions get one intentional discovery area. Interleaving wide cards
          inside product categories becomes noisy as soon as a business has
          more than one offer; a horizontal rail keeps the menu's scan rhythm
          intact while making the next promotion visibly available. */}
      {!searching && activePromotions.length > 0 && (
        <section className="mb-5 mt-4" aria-labelledby="table-offers-heading">
          <div className="mb-2 flex items-end justify-between gap-3">
            <div>
              <p id="table-offers-heading" className="flex items-center gap-1 text-xs font-bold text-foreground">
                <Tag className="h-3.5 w-3.5 text-accent" aria-hidden />
                Ofertas para ti
              </p>
              <p className="mt-0.5 text-[10px] leading-3 text-muted-foreground">
                Aplicamos el mejor descuento disponible.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">
                {activePromotions.length} {activePromotions.length === 1 ? "oferta" : "ofertas"}
              </span>
              {activePromotions.length > 1 && (
                <p className="mt-1 text-[10px] font-semibold text-accent">Desliza para verlas</p>
              )}
            </div>
          </div>
          <div className="relative">
            <div
              className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 pr-5 touch-pan-x"
              aria-label="Carrusel de promociones"
            >
              {activePromotions.map((promotion) => (
                <PromoBanner
                  key={promotion.id}
                  promotion={promotion}
                  cartListTotal={cartListTotal}
                  onAddPromotion={onAddPromotion}
                  className={`${activePromotions.length > 1 ? "basis-[calc(100%-1.25rem)]" : "basis-full"} shrink-0 snap-start`}
                />
              ))}
            </div>
            {activePromotions.length > 1 && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end bg-gradient-to-l from-background via-background/90 to-transparent"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/20 bg-surface text-accent shadow-sm">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </span>
            )}
          </div>
        </section>
      )}

      {/* Sticky category nav — thumbnail + name. A row of bare text pills reads
          as chrome; the photo is what makes someone tap it. */}
      {showPills && (
        <div className="sticky top-0 z-20 -mx-5 mb-3 border-b border-border bg-background px-5 py-2.5 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Explorando</p>
              <p className="truncate text-sm font-bold text-foreground">{activeSection?.name || "Menú"}</p>
            </div>
            <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-bold text-accent">
              {activeSection?.products.length ?? 0} {(activeSection?.products.length ?? 0) === 1 ? "opción" : "opciones"}
            </span>
          </div>
          <div className="relative">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pr-8">
              {sections.map((s) => {
                const active = (activeId ?? sections[0]?.id) === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className={`flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border py-1 pl-1 pr-3.5 text-xs font-bold transition-all active:scale-[0.97] ${
                      active
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-surface text-muted-foreground hover:border-accent/40"
                    }`}
                  >
                    <BrandImage
                      src={sectionThumbnail(s.products)}
                      logoUrl={tenantLogoUrl}
                      name={tenantName}
                      alt={s.name || "Menú"}
                      className="h-8 w-8 shrink-0"
                      rounded="rounded-full"
                      sizes="32px"
                    />
                    {s.name || "Menú"}
                  </button>
                );
              })}
            </div>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end bg-gradient-to-l from-background via-background/90 to-transparent"
            >
              <ChevronRight className="h-4 w-4 text-accent" />
            </span>
          </div>
        </div>
      )}

      {/* Searching → flat grid */}
      {searching ? (
        filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No encontramos productos que coincidan con tu búsqueda.
          </p>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <MenuProductCard
                key={item.id}
                product={item}
                quantity={quantities[item.id] ?? 0}
                onAdd={onAdd}
                onDecrement={onDecrement}
                onOpenDetail={setDetail}
                tenantLogoUrl={tenantLogoUrl}
                tenantName={tenantName}
                promotionalPrice={promotionalPrice(item)?.price}
                promotionName={promotionalPrice(item)?.name}
              />
            ))}
          </div>
        )
      ) : (
        /* Grouped sections */
        <div className="space-y-6">
          {sections.map((s) => (
            <section
              key={s.id}
              id={`sec-${s.id}`}
              ref={(el) => {
                sectionRefs.current[s.id] = el;
              }}
              className="scroll-mt-28"
            >
              {s.name && (
                <h3 className="mb-2.5 text-sm font-bold uppercase tracking-wide text-foreground">
                  {s.name}
                </h3>
              )}
              <div className="space-y-2.5">
                {s.products.map((item) => (
                  <MenuProductCard
                    key={item.id}
                    product={item}
                    quantity={quantities[item.id] ?? 0}
                    onAdd={onAdd}
                    onDecrement={onDecrement}
                    onOpenDetail={setDetail}
                    tenantLogoUrl={tenantLogoUrl}
                    tenantName={tenantName}
                    promotionalPrice={promotionalPrice(item)?.price}
                    promotionName={promotionalPrice(item)?.name}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      </>
      )}

      <ProductDetailSheet
        product={detail}
        isOpen={detail !== null}
        onClose={() => setDetail(null)}
        inCartQuantity={detail ? (quantities[detail.id] ?? 0) : 0}
        onAdd={onAddMany}
        tenantLogoUrl={tenantLogoUrl}
        tenantName={tenantName}
      />
    </div>
  );
}
