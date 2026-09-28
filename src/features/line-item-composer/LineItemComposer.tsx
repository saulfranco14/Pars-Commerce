"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  ArrowLeft,
  ChevronRight,
  Package,
  Search,
  ShoppingBag,
  Trash2,
  Wrench,
  X,
} from "lucide-react";

import { swrFetcher } from "@/lib/swrFetcher";
import type { ProductListItem } from "@/types/products";

export type LineItemDraft = { product_id: string; quantity: number };

type Props = {
  tenantId: string;
  documentKey: string;
  isOpen: boolean;
  onClose: () => void;
  onCommit: (items: LineItemDraft[]) => Promise<void>;
  initialItems?: LineItemDraft[];
  title?: string;
  commitLabel?: string;
};

const money = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);

const EMPTY_PRODUCTS: ProductListItem[] = [];
const EMPTY_DRAFT: LineItemDraft[] = [];

function draftStorageKey(key: string) {
  return `tlaco:line-item-draft:${key}`;
}

function normalize(items: LineItemDraft[]) {
  const byProduct = new Map<string, number>();
  for (const item of items) {
    const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (!item.product_id || quantity === 0) continue;
    byProduct.set(item.product_id, (byProduct.get(item.product_id) ?? 0) + quantity);
  }
  return [...byProduct].map(([product_id, quantity]) => ({ product_id, quantity }));
}

function useVisualViewportHeight(open: boolean) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const viewport = window.visualViewport;
    const update = () => setHeight(Math.round(viewport?.height ?? window.innerHeight));
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return height;
}

function ProductImage({ product }: { product: ProductListItem }) {
  if (product.image_url) {
    // The tenant controls the Storage domain for its catalogue images.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.image_url} alt="" className="h-full w-full object-cover" />;
  }
  return product.type === "service" ? (
    <Wrench className="h-5 w-5 text-accent" aria-hidden />
  ) : (
    <Package className="h-5 w-5 text-muted-foreground" aria-hidden />
  );
}

/**
 * Shared, draft-first catalogue picker. It intentionally has no document
 * knowledge: orders, quotes and future offers commit the same compact list.
 */
export function LineItemComposer({
  tenantId,
  documentKey,
  isOpen,
  onClose,
  onCommit,
  initialItems = EMPTY_DRAFT,
  title = "Agregar artículos",
  commitLabel,
}: Props) {
  const [draft, setDraft] = useState<LineItemDraft[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [reviewing, setReviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const height = useVisualViewportHeight(isOpen);
  const productsKey = isOpen
    ? `/api/products?tenant_id=${encodeURIComponent(tenantId)}`
    : null;
  const picksKey = isOpen
    ? `/api/products/quick-picks?tenant_id=${encodeURIComponent(tenantId)}`
    : null;
  const { data: productsData, isLoading } = useSWR<ProductListItem[]>(
    productsKey,
    swrFetcher,
    { revalidateOnFocus: false, fallbackData: EMPTY_PRODUCTS },
  );
  const { data: quickPicks = EMPTY_PRODUCTS } = useSWR<ProductListItem[]>(
    picksKey,
    swrFetcher,
    { revalidateOnFocus: false },
  );
  const products = Array.isArray(productsData) ? productsData : EMPTY_PRODUCTS;

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setReviewing(false);
    const raw = window.sessionStorage.getItem(draftStorageKey(documentKey));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as LineItemDraft[];
        setDraft(normalize(parsed));
        return;
      } catch {
        window.sessionStorage.removeItem(draftStorageKey(documentKey));
      }
    }
    setDraft(normalize(initialItems));
  }, [documentKey, initialItems, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    window.sessionStorage.setItem(draftStorageKey(documentKey), JSON.stringify(draft));
  }, [documentKey, draft, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const quantityById = useMemo(
    () => new Map(draft.map((item) => [item.product_id, item.quantity])),
    [draft],
  );
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const categories = useMemo(() => {
    const names = new Map<string, string>();
    for (const product of products) {
      if (product.subcatalog_id) names.set(product.subcatalog_id, product.subcatalog?.name ?? "Sin categoría");
    }
    return [...names].map(([id, name]) => ({ id, name }));
  }, [products]);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es-MX");
    return products.filter((product) => {
      const matchesCategory = category === "all" || product.subcatalog_id === category;
      const matchesQuery = !normalizedQuery || product.name.toLocaleLowerCase("es-MX").includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);
  const featured = query || category !== "all" ? [] : (quickPicks.length ? quickPicks : products.slice(0, 12));
  const totalQuantity = draft.reduce((total, item) => total + item.quantity, 0);
  const total = draft.reduce(
    (sum, item) => sum + (Number(productById.get(item.product_id)?.price ?? 0) * item.quantity),
    0,
  );

  const changeQuantity = useCallback((productId: string, delta: number) => {
    setDraft((current) => {
      const found = current.find((item) => item.product_id === productId);
      const nextQuantity = Math.max(0, (found?.quantity ?? 0) + delta);
      if (!nextQuantity) return current.filter((item) => item.product_id !== productId);
      if (found) return current.map((item) => item.product_id === productId ? { ...item, quantity: nextQuantity } : item);
      return [...current, { product_id: productId, quantity: nextQuantity }];
    });
  }, []);

  const commit = async () => {
    if (!draft.length) return;
    setSaving(true);
    setError(null);
    try {
      await onCommit(draft);
      window.sessionStorage.removeItem(draftStorageKey(documentKey));
      setDraft([]);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos guardar los artículos.");
      setReviewing(true);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const rows = reviewing ? draft.map((item) => productById.get(item.product_id)).filter((product): product is ProductListItem => Boolean(product)) : filtered;
  const panelStyle = height ? { "--composer-height": `${height}px` } as React.CSSProperties : undefined;

  return (
    <div className="fixed inset-0 z-[110] bg-surface md:flex md:items-center md:justify-center md:bg-black/50 md:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <section style={panelStyle} className="flex h-[var(--composer-height,100dvh)] w-full flex-col bg-surface md:h-[min(44rem,calc(100vh-3rem))] md:max-w-6xl md:overflow-hidden md:rounded-2xl md:border md:border-border md:shadow-2xl">
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b border-border px-4 md:px-6">
          <button type="button" onClick={() => reviewing ? setReviewing(false) : onClose()} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-foreground hover:bg-border-soft" aria-label={reviewing ? "Volver al catálogo" : "Cerrar"}>
            {reviewing ? <ArrowLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
          <div className="min-w-0 flex-1"><h2 className="truncate text-base font-bold text-foreground">{reviewing ? "Revisar selección" : title}</h2><p className="text-xs text-muted-foreground">{reviewing ? "Ajusta cantidades o vuelve a buscar antes de confirmar." : totalQuantity ? `${totalQuantity} ${totalQuantity === 1 ? "artículo" : "artículos"} seleccionados` : "Selecciona varios y agrégalos al final"}</p></div>
          {totalQuantity > 0 && <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">{totalQuantity}</span>}
        </header>

        {!reviewing && <div className="shrink-0 border-b border-border bg-surface px-4 py-3 md:px-6"><label className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden /><input value={query} onChange={(event) => setQuery(event.target.value)} inputMode="search" enterKeyHint="search" placeholder="Buscar producto o servicio" className="input-form min-h-12 w-full rounded-xl py-3 pl-11 pr-3 text-base placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" /></label><div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]"><button type="button" onClick={() => setCategory("all")} className={`min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold ${category === "all" ? "bg-accent text-accent-foreground" : "border border-border bg-surface text-muted-foreground"}`}>Todos</button>{categories.map((entry) => <button key={entry.id} type="button" onClick={() => setCategory(entry.id)} className={`min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold ${category === entry.id ? "bg-accent text-accent-foreground" : "border border-border bg-surface text-muted-foreground"}`}>{entry.name}</button>)}</div></div>}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6">
          {error && <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
          {!reviewing && !query && category === "all" && featured.length > 0 && <section className="mb-6"><div className="mb-3 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><ShoppingBag className="h-4 w-4" /></span><div><h3 className="text-sm font-bold text-foreground">Más vendidos</h3><p className="text-xs text-muted-foreground">Tus favoritos para atender rápido</p></div></div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{featured.map((product) => <ProductRow key={`featured-${product.id}`} product={product} quantity={quantityById.get(product.id) ?? 0} onChange={changeQuantity} />)}</div></section>}
          {reviewing ? <section><div className="mb-3 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2.5 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Todo sigue editable.</span> Ajusta cada cantidad aquí o usa “Seguir agregando” para volver al catálogo.</div><div className="space-y-2">{rows.map((product) => <ProductRow key={product.id} product={product} quantity={quantityById.get(product.id) ?? 0} onChange={changeQuantity} review />)}</div></section> : <section><h3 className="mb-3 text-sm font-bold text-foreground">{query ? `Resultados (${filtered.length})` : category === "all" ? "Todo el catálogo" : categories.find((item) => item.id === category)?.name}</h3>{isLoading ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-22 animate-pulse rounded-xl bg-border-soft" />)}</div> : rows.length ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{rows.map((product) => <ProductRow key={product.id} product={product} quantity={quantityById.get(product.id) ?? 0} onChange={changeQuantity} />)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No encontramos productos con esa búsqueda.</div>}</section>}
        </div>

        <footer className="shrink-0 border-t border-border bg-surface/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-bold tabular-nums text-foreground">{totalQuantity ? `${totalQuantity} artículos · ${money(total)}` : "Tu selección está vacía"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{reviewing ? "Confirma una vez cuando la selección esté lista." : "Se guardarán todos en una sola acción."}</p>
            </div>
            <div className="min-w-0">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{reviewing ? "Confirmar selección" : "Siguiente paso"}</p>
              <div className="flex gap-2">
                {reviewing && <button type="button" disabled={saving} onClick={() => setReviewing(false)} className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft disabled:opacity-50 md:flex-none">Seguir agregando</button>}
                <button type="button" disabled={!totalQuantity || saving} onClick={() => reviewing ? void commit() : setReviewing(true)} className="inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 md:flex-none">{saving ? "Guardando…" : reviewing ? (commitLabel ?? `Confirmar ${totalQuantity} artículos`) : <>Revisar <ChevronRight className="h-4 w-4" /></>}</button>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ProductRow({ product, quantity, onChange, review = false }: { product: ProductListItem; quantity: number; onChange: (id: string, delta: number) => void; review?: boolean }) {
  return <article className={`flex min-h-22 items-center gap-3 rounded-xl border p-2.5 ${quantity ? "border-accent/40 bg-accent/5" : "border-border bg-surface-raised"}`}><span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface"><ProductImage product={product} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{product.name}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{product.type === "service" ? "Servicio" : "Producto"}{product.subcatalog?.name ? ` · ${product.subcatalog.name}` : ""}</p><p className="mt-1 text-sm font-bold tabular-nums text-accent">{money(Number(product.price))}</p></div>{quantity > 0 ? <div className="flex h-11 shrink-0 items-center rounded-xl border border-accent/30 bg-surface"><button type="button" onClick={() => onChange(product.id, -1)} className="flex h-11 w-11 items-center justify-center rounded-l-xl text-lg font-bold text-muted-foreground hover:bg-border-soft" aria-label={`Restar ${product.name}`}>{review && quantity === 1 ? <Trash2 className="h-4 w-4 text-red-500" /> : "−"}</button><span className="min-w-7 text-center text-sm font-bold tabular-nums text-foreground">{quantity}</span><button type="button" onClick={() => onChange(product.id, 1)} className="flex h-11 w-11 items-center justify-center rounded-r-xl bg-accent text-lg font-bold text-accent-foreground hover:bg-accent/90" aria-label={`Sumar ${product.name}`}>+</button></div> : <button type="button" onClick={() => onChange(product.id, 1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/5 text-lg font-bold text-accent hover:bg-accent hover:text-accent-foreground" aria-label={`Agregar ${product.name}`}>+</button>}</article>;
}
