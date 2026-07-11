"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, Search, X } from "lucide-react";

import { MenuPeekRow } from "@/features/qr/components/MenuPeekRow";
import { MenuProductCard } from "@/features/qr/components/MenuProductCard";
import { PromoBanner } from "@/features/qr/components/PromoBanner";
import { ReorderRow } from "@/features/qr/components/ReorderRow";
import { ProductDetailSheet } from "@/features/qr/components/ProductDetailSheet";
import { interleavePromos } from "@/features/qr/helpers/interleavePromos";
import { useMenuSections } from "@/features/qr/hooks/useMenuSections";

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
  /** Active promotions to interleave as banners between menu products. */
  promotions?: QrPromotion[];
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
}: TableMenuSectionsProps) {
  const { query, setQuery, searching, filtered, sections, totalCount } =
    useMenuSections({ products, categories });

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
  // Search is available whenever the menu is open and there's more than a
  // handful of products (a search box over 3 items is noise).
  const showSearch = totalCount >= 5 && expanded;

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
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
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
    const top = node.getBoundingClientRect().top + window.scrollY - 76;
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
          {reorderProducts && reorderProducts.length > 0 && (
            <ReorderRow
              products={reorderProducts}
              onAdd={onAdd}
              onOpenDetail={setDetail}
              tenantLogoUrl={tenantLogoUrl}
              tenantName={tenantName}
            />
          )}
          <MenuPeekRow
            products={peekProducts}
            onAdd={onAdd}
            onOpenDetail={setDetail}
            onExpand={() => setExpanded(true)}
            tenantLogoUrl={tenantLogoUrl}
            tenantName={tenantName}
          />
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
          className="mb-3 flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-border-soft/50 px-3 text-left transition-colors hover:bg-border-soft active:scale-[0.99]"
        >
          <span className="text-sm font-bold text-foreground">Menú</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
            Ocultar
            <ChevronUp className="h-4 w-4" />
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

      {/* Sticky category pills */}
      {showPills && (
        <div className="sticky top-0 z-20 -mx-5 mb-3 border-b border-border bg-background/95 px-5 py-2 backdrop-blur-sm">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((s) => {
              const active = activeId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "bg-border-soft/60 text-muted-foreground hover:bg-border-soft"
                  }`}
                >
                  {s.name || "Menú"}
                </button>
              );
            })}
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
              />
            ))}
          </div>
        )
      ) : (
        /* Grouped sections */
        <div className="space-y-6">
          {sections.map((s, si) => (
            <section
              key={s.id}
              id={`sec-${s.id}`}
              ref={(el) => {
                sectionRefs.current[s.id] = el;
              }}
              className="scroll-mt-20"
            >
              {s.name && (
                <h3 className="mb-2.5 text-sm font-bold uppercase tracking-wide text-foreground">
                  {s.name}
                </h3>
              )}
              <div className="space-y-2.5">
                {/* Promos ride in the FIRST section only, so a banner set never
                    repeats across sections. Interleaving is a pure helper. */}
                {interleavePromos(
                  s.products,
                  si === 0 ? (promotions ?? []) : [],
                ).map((entry) =>
                  entry.kind === "promo" ? (
                    <PromoBanner
                      key={`promo-${entry.item.id}`}
                      promotion={entry.item}
                    />
                  ) : (
                    <MenuProductCard
                      key={entry.item.id}
                      product={entry.item}
                      quantity={quantities[entry.item.id] ?? 0}
                      onAdd={onAdd}
                      onDecrement={onDecrement}
                      onOpenDetail={setDetail}
                      tenantLogoUrl={tenantLogoUrl}
                      tenantName={tenantName}
                    />
                  ),
                )}
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
