"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useActiveTenant } from "@/stores/useTenantStore";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FolderTree, GripVertical, PackagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { FAB } from "@/components/ui/FAB";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableHeaderCellRightClass,
  tableBodyRowClass,
  tableBodyCellClass,
  tableBodyCellMutedClass,
  tableBodyCellRightClass,
} from "@/components/ui/TableWrapper";
import { swrFetcher } from "@/lib/swrFetcher";
import { isAbortError } from "@/services/apiFetch";
import type { ProductListItem } from "@/types/products";
import type { Subcatalog } from "@/types/subcatalogs";
import { remove, reorder } from "@/services/productsService";
import {
  btnPrimary,
  btnSecondarySmall,
  btnDangerSmall,
} from "@/components/ui/buttonClasses";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProductFormSheet } from "@/features/productos/components/ProductFormSheet";
import { SortableCatalogCard } from "@/components/catalog/SortableCatalogCard";
import { QuickInventoryUpdateSheet } from "@/features/productos/components/QuickInventoryUpdateSheet";

const subcatalogsKey = (tenantId: string) =>
  `/api/subcatalogs?tenant_id=${encodeURIComponent(tenantId)}`;

function buildProductsKey(
  tenantId: string,
  subcatalogId: string,
  search: string,
): string | null {
  if (!tenantId) return null;
  const params = new URLSearchParams({
    tenant_id: tenantId,
    type: "product",
  });
  if (subcatalogId) {
    params.set("subcatalog_id", subcatalogId);
  }
  if (search.trim().length >= 2) params.set("q", search.trim());
  return `/api/products?${params}`;
}

function buildSubcatalogTabs(subcatalogs: Subcatalog[]) {
  const tabs = [{ value: "", label: "Todos" }];
  for (const sc of subcatalogs) {
    tabs.push({ value: sc.id, label: sc.name });
  }
  return tabs;
}

export default function ProductosPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();
  const [subcatalogFilter, setSubcatalogFilter] = useState(
    () => searchParams.get("subcatalog_id") ?? "",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [sortMode, setSortMode] = useState(() => searchParams.get("sort") ?? "manual");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    const urlValue = searchParams.get("subcatalog_id") ?? "";
    if (urlValue !== subcatalogFilter) {
      setSubcatalogFilter(urlValue);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") setCreateOpen(true);
  }, [searchParams]);

  function closeCreate() {
    setCreateOpen(false);
    if (searchParams.get("nuevo") === "1") {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("nuevo");
      router.replace(`/dashboard/${tenantSlug}/productos${next.size ? `?${next}` : ""}`);
    }
  }

  function updateListUrl(next: { subcatalog?: string; q?: string; sort?: string }) {
    const query = new URLSearchParams(searchParams.toString());
    query.delete("nuevo");
    const subcatalog = next.subcatalog ?? subcatalogFilter;
    const q = next.q ?? search;
    const sort = next.sort ?? sortMode;
    subcatalog ? query.set("subcatalog_id", subcatalog) : query.delete("subcatalog_id");
    q.trim() ? query.set("q", q.trim()) : query.delete("q");
    sort !== "manual" ? query.set("sort", sort) : query.delete("sort");
    router.replace(`/dashboard/${tenantSlug}/productos${query.size ? `?${query}` : ""}`, { scroll: false });
  }

  function handleSubcatalogChange(value: string) {
    setSubcatalogFilter(value);
    updateListUrl({ subcatalog: value });
  }

  const subcatalogsKeyValue = activeTenant
    ? subcatalogsKey(activeTenant.id)
    : null;
  const { data: subcatalogsData } = useSWR<Subcatalog[]>(
    subcatalogsKeyValue,
    swrFetcher,
    { fallbackData: [] },
  );
  const subcatalogs = Array.isArray(subcatalogsData) ? subcatalogsData : [];
  const productTabs = buildSubcatalogTabs(subcatalogs);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] =
    useState<ProductListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [quickUpdateProduct, setQuickUpdateProduct] = useState<ProductListItem | null>(null);

  const key = activeTenant
    ? buildProductsKey(activeTenant.id, subcatalogFilter, search)
    : null;
  const {
    data: productsData,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR<ProductListItem[]>(key, swrFetcher, { fallbackData: [] });
  const products = Array.isArray(productsData) ? productsData : [];
  const visibleProducts = [...products].sort((a, b) => {
    if (sortMode === "az") return a.name.localeCompare(b.name, "es");
    if (sortMode === "za") return b.name.localeCompare(a.name, "es");
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const currentQuery = searchParams.toString();
  const currentReturnPath = `/dashboard/${tenantSlug}/productos${currentQuery ? `?${currentQuery}` : ""}`;
  const editHref = (id: string) =>
    `/dashboard/${tenantSlug}/productos/${id}?returnTo=${encodeURIComponent(currentReturnPath)}`;

  async function moveProduct(sourceId: string, targetId: string) {
    if (!activeTenant || sourceId === targetId || search.trim() || sortMode !== "manual") return;
    const sourceIndex = visibleProducts.findIndex((item) => item.id === sourceId);
    const targetIndex = visibleProducts.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...visibleProducts];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setActionError(null);
    setReordering(true);
    await mutate(next.map((item, index) => ({ ...item, sort_order: index })), false);
    try {
      await reorder(activeTenant.id, next.map((item) => item.id));
      await mutate();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "No se pudo guardar el orden");
      await mutate();
    } finally {
      setReordering(false);
    }
  }

  const error =
    actionError ??
    (swrError && !isAbortError(swrError)
      ? "No se pudieron cargar los productos"
      : null);

  function openDeleteModal(p: ProductListItem) {
    setProductToDelete(p);
  }

  function closeDeleteModal() {
    if (!deletingId) setProductToDelete(null);
  }

  async function handleDeleteConfirm() {
    if (!productToDelete) return;
    const id = productToDelete.id;
    setDeletingId(id);
    setActionError(null);
    try {
      await remove(id);
      setProductToDelete(null);
      await mutate();
    } catch (e) {
      setProductToDelete(null);
      setActionError(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-4 sm:px-0">
        <PageHeader
          title="Productos"
          description="Gestiona tu catálogo de productos y sus subcatálogos."
        />

        {/* Navegación secundaria — link de texto, no un botón pill, para que
            no se confunda con los tabs de filtro que vienen justo debajo. */}
        <Link
          href={`/dashboard/${tenantSlug}/productos/subcatalogos`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
        >
          <FolderTree className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Administrar subcatálogos
        </Link>

        {/* Único punto de creación — FAB en móvil y desktop. */}
        <FAB
          onClick={() => setCreateOpen(true)}
          aria-label="Nuevo producto"
          alwaysVisible
        >
          <Plus className="h-6 w-6 shrink-0" aria-hidden />
        </FAB>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
            {error}
          </div>
        )}

        <div className="border-t border-border-soft pt-3">
          <FilterTabs
            tabs={productTabs}
            activeValue={subcatalogFilter}
            onTabChange={handleSubcatalogChange}
            ariaLabel="Filtrar por subcatalog"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
            <Search className="h-4 w-4 text-muted" aria-hidden />
            <input value={search} onChange={(event) => setSearch(event.target.value)} onBlur={() => updateListUrl({ q: search })} onKeyDown={(event) => { if (event.key === "Enter") updateListUrl({ q: search }); }} placeholder="Buscar por nombre o SKU" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
          <select value={sortMode} onChange={(event) => { const value = event.target.value; setSortMode(value); updateListUrl({ sort: value }); }} className="min-h-11 rounded-xl border border-border bg-surface-raised px-3 text-sm font-medium">
            <option value="manual">Orden de la tienda</option><option value="az">Nombre A–Z</option><option value="za">Nombre Z–A</option>
          </select>
        </div>
        <p className="text-xs text-muted">{search.trim() || sortMode !== "manual" ? "Limpia la búsqueda y elige “Orden de la tienda” para acomodar los productos." : reordering ? "Guardando el nuevo orden…" : "Mantén presionado el asa y arrastra para acomodar lo que tu cliente verá primero."}</p>
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <LoadingBlock
            variant="skeleton"
            message="Cargando productos"
            skeletonRows={6}
          />
        ) : visibleProducts.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised p-8 text-center">
            <p className="text-sm text-muted">
              No hay productos{subcatalogFilter ? " en este subcatálogo" : ""}.
              Crea uno con &quot;Nuevo producto&quot;.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={`mt-4 ${btnPrimary}`}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Crear primer producto
            </button>
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={({ active }) => setDraggedId(String(active.id))}
              onDragCancel={() => setDraggedId(null)}
              onDragEnd={({ active, over }) => {
                setDraggedId(null);
                if (over) void moveProduct(String(active.id), String(over.id));
              }}
            >
              <SortableContext items={visibleProducts.map((product) => product.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 md:hidden">
                  {visibleProducts.map((p) => (
                    <SortableCatalogCard
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      imageUrl={p.image_url}
                      price={Number(p.price)}
                      tag={p.subcatalog?.name ?? p.theme ?? null}
                      detail={`${p.unit || "unit"}${p.sku ? ` · ${p.sku}` : ""} · Stock: ${p.stock}`}
                      disabled={Boolean(search.trim()) || sortMode !== "manual" || reordering}
                      editHref={editHref(p.id)}
                      deleting={deletingId === p.id}
                      onDelete={() => openDeleteModal(p)}
                      onQuickUpdate={() => setQuickUpdateProduct(p)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="hidden md:block">
              <TableWrapper>
                <table className="min-w-full">
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}><span className="sr-only">Orden</span></th>
                      <th className={tableHeaderCellClass}>Imagen</th>
                      <th className={tableHeaderCellClass}>Nombre</th>
                      <th className={tableHeaderCellClass}>SKU</th>
                      <th className={tableHeaderCellClass}>Unidad</th>
                      <th className={tableHeaderCellRightClass}>Precio</th>
                      <th className={tableHeaderCellRightClass}>Stock</th>
                      <th className={tableHeaderCellRightClass}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((p) => (
                      <tr key={p.id} draggable={!search.trim() && sortMode === "manual" && !reordering} onDragStart={() => setDraggedId(p.id)} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) void moveProduct(draggedId, p.id); }} className={`${tableBodyRowClass} ${draggedId === p.id ? "opacity-50" : ""}`}>
                        <td className={tableBodyCellClass}><GripVertical className={`h-5 w-5 ${search.trim() || sortMode !== "manual" ? "text-muted/30" : "cursor-grab text-muted"}`} aria-hidden /></td>
                        <td className={tableBodyCellClass}>
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className={tableBodyCellClass}>
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">
                              {p.name}
                            </span>
                              <button
                                type="button"
                                onClick={() => setQuickUpdateProduct(p)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-accent transition-colors hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                                aria-label={`Actualizar existencias o precio de ${p.name}`}
                                title="Actualizar existencias o precio"
                              >
                                <PackagePlus className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {p.subcatalog && (
                                <span className="inline-flex rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                                  {p.subcatalog.name}
                                </span>
                              )}
                              {p.theme && (
                                <span className="text-xs text-muted">
                                  Tema: {p.theme}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={tableBodyCellMutedClass}>
                          {p.sku ?? "—"}
                        </td>
                        <td className={tableBodyCellMutedClass}>
                          {p.unit || "unit"}
                        </td>
                        <td className={tableBodyCellRightClass}>
                          ${Number(p.price).toFixed(2)}
                        </td>
                        <td className={`${tableBodyCellMutedClass} text-right`}>
                          {p.stock}
                        </td>
                        <td className={tableBodyCellClass}>
                          <div className="flex justify-end gap-2">
                            <Link
                              href={editHref(p.id)}
                              className={btnSecondarySmall}
                            >
                              <Pencil
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden
                              />
                              Editar
                            </Link>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(p)}
                              disabled={deletingId === p.id}
                              className={btnDangerSmall}
                              aria-label={`Eliminar ${p.name}`}
                            >
                              <Trash2
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden
                              />
                              {deletingId === p.id ? "..." : "Eliminar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrapper>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={productToDelete !== null}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Eliminar producto"
        message={
          productToDelete
            ? `¿Eliminar "${productToDelete.name}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        confirmDanger
        loading={deletingId !== null}
      />

      <ProductFormSheet
        isOpen={createOpen}
        onClose={closeCreate}
        tenantId={activeTenant.id}
        initialSubcatalogId={subcatalogFilter}
        onCreated={async () => {
          await mutate();
          closeCreate();
        }}
      />

      <QuickInventoryUpdateSheet
        product={quickUpdateProduct}
        isOpen={quickUpdateProduct !== null}
        onClose={() => setQuickUpdateProduct(null)}
        onSaved={async () => {
          await mutate();
        }}
      />
    </div>
  );
}
