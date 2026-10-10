"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useActiveTenant } from "@/stores/useTenantStore";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { FolderTree, GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { ServiceFormSheet } from "@/features/servicios/components/ServiceFormSheet";
import { SortableCatalogCard } from "@/components/catalog/SortableCatalogCard";

const subcatalogsKey = (tenantId: string) =>
  `/api/subcatalogs?tenant_id=${encodeURIComponent(tenantId)}`;

function buildServicesKey(tenantId: string, subcatalogId: string, search: string): string {
  const params = new URLSearchParams({ tenant_id: tenantId, type: "service" });
  if (subcatalogId) params.set("subcatalog_id", subcatalogId);
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

export default function ServiciosPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] =
    useState<ProductListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [subcatalogFilter, setSubcatalogFilter] = useState(
    () => searchParams.get("subcatalog_id") ?? "",
  );
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [sortMode, setSortMode] = useState(() => searchParams.get("sort") ?? "manual");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (searchParams.get("nuevo") === "1") setCreateOpen(true);
  }, [searchParams]);

  useEffect(() => {
    const urlValue = searchParams.get("subcatalog_id") ?? "";
    if (urlValue !== subcatalogFilter) {
      setSubcatalogFilter(urlValue);
    }
  }, [searchParams]);

  function closeCreate() {
    setCreateOpen(false);
    if (searchParams.get("nuevo") === "1") {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("nuevo");
      router.replace(`/dashboard/${tenantSlug}/servicios${next.size ? `?${next}` : ""}`);
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
    router.replace(`/dashboard/${tenantSlug}/servicios${query.size ? `?${query}` : ""}`, { scroll: false });
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
  const subcatalogTabs = buildSubcatalogTabs(subcatalogs);

  const key = activeTenant
    ? buildServicesKey(activeTenant.id, subcatalogFilter, search)
    : null;
  const {
    data: servicesData,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR<ProductListItem[]>(key, swrFetcher, { fallbackData: [] });
  const services = Array.isArray(servicesData) ? servicesData : [];
  const visibleServices = [...services].sort((a, b) => {
    if (sortMode === "az") return a.name.localeCompare(b.name, "es");
    if (sortMode === "za") return b.name.localeCompare(a.name, "es");
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const currentQuery = searchParams.toString();
  const currentReturnPath = `/dashboard/${tenantSlug}/servicios${currentQuery ? `?${currentQuery}` : ""}`;
  const editHref = (id: string) => `/dashboard/${tenantSlug}/servicios/${id}?returnTo=${encodeURIComponent(currentReturnPath)}`;

  async function moveService(sourceId: string, targetId: string) {
    if (!activeTenant || sourceId === targetId || search.trim() || sortMode !== "manual") return;
    const sourceIndex = visibleServices.findIndex((item) => item.id === sourceId);
    const targetIndex = visibleServices.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const next = [...visibleServices];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setActionError(null);
    setReordering(true);
    await mutate(next.map((item, index) => ({ ...item, sort_order: index })), false);
    try { await reorder(activeTenant.id, next.map((item) => item.id)); await mutate(); }
    catch (e) { setActionError(e instanceof Error ? e.message : "No se pudo guardar el orden"); await mutate(); }
    finally { setReordering(false); }
  }

  const error =
    actionError ??
    (swrError && !isAbortError(swrError)
      ? "No se pudieron cargar los servicios"
      : null);

  function openDeleteModal(s: ProductListItem) {
    setServiceToDelete(s);
  }

  function closeDeleteModal() {
    if (!deletingId) setServiceToDelete(null);
  }

  async function handleDeleteConfirm() {
    if (!serviceToDelete) return;
    const id = serviceToDelete.id;
    setDeletingId(id);
    setActionError(null);
    try {
      await remove(id);
      setServiceToDelete(null);
      await mutate();
    } catch (e) {
      setServiceToDelete(null);
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
          title="Servicios"
          description="Gestiona tu catálogo de servicios."
        />

        <Link href={`/dashboard/${tenantSlug}/productos/subcatalogos`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"><FolderTree className="h-3.5 w-3.5" aria-hidden />Administrar subcatálogos</Link>

        {/* Único punto de creación — FAB en móvil y desktop. */}
        <FAB
          onClick={() => setCreateOpen(true)}
          aria-label="Nuevo servicio"
          alwaysVisible
        >
          <Plus className="h-6 w-6 shrink-0" aria-hidden />
        </FAB>

        <div className="border-t border-border-soft pt-3">
          <FilterTabs
            tabs={subcatalogTabs}
            activeValue={subcatalogFilter}
            onTabChange={handleSubcatalogChange}
            ariaLabel="Filtrar por subcatálogo"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-raised px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15"><Search className="h-4 w-4 text-muted" aria-hidden /><input value={search} onChange={(event) => setSearch(event.target.value)} onBlur={() => updateListUrl({ q: search })} onKeyDown={(event) => { if (event.key === "Enter") updateListUrl({ q: search }); }} placeholder="Buscar servicio o SKU" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
          <select value={sortMode} onChange={(event) => { const value = event.target.value; setSortMode(value); updateListUrl({ sort: value }); }} className="min-h-11 rounded-xl border border-border bg-surface-raised px-3 text-sm font-medium"><option value="manual">Orden de la tienda</option><option value="az">Nombre A–Z</option><option value="za">Nombre Z–A</option></select>
        </div>
        <p className="text-xs text-muted">{search.trim() || sortMode !== "manual" ? "Limpia la búsqueda y elige “Orden de la tienda” para acomodar los servicios." : reordering ? "Guardando el nuevo orden…" : "Mantén presionado el asa y arrastra para acomodar lo que tu cliente verá primero."}</p>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 alert-error">
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <LoadingBlock
            variant="skeleton"
            message="Cargando servicios"
            skeletonRows={6}
          />
        ) : visibleServices.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised p-8 text-center m-2 mt-8">
            <p className="text-sm text-muted">
              No hay servicios. Crea uno con &quot;Nuevo servicio&quot;.
            </p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className={`mt-4 ${btnPrimary}`}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              Crear primer servicio
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
                if (over) void moveService(String(active.id), String(over.id));
              }}
            >
              <SortableContext items={visibleServices.map((service) => service.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 md:hidden">
                  {visibleServices.map((s) => (
                    <SortableCatalogCard
                      key={s.id}
                      id={s.id}
                      name={s.name}
                      imageUrl={s.image_url}
                      price={Number(s.price)}
                      tag={s.subcatalog?.name ?? s.theme ?? null}
                      detail={s.sku ? `SKU: ${s.sku}` : "Sin SKU"}
                      disabled={Boolean(search.trim()) || sortMode !== "manual" || reordering}
                      editHref={editHref(s.id)}
                      deleting={deletingId === s.id}
                      onDelete={() => openDeleteModal(s)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className="hidden py-2 md:block lg:py-3">
              <TableWrapper>
                <table className="min-w-full">
                  <thead>
                    <tr className={tableHeaderRowClass}>
                      <th className={tableHeaderCellClass}><span className="sr-only">Orden</span></th>
                      <th className={tableHeaderCellClass}>Imagen</th>
                      <th className={tableHeaderCellClass}>Nombre</th>
                      <th className={tableHeaderCellClass}>SKU</th>
                      <th className={tableHeaderCellRightClass}>Precio</th>
                      <th className={tableHeaderCellRightClass}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleServices.map((s) => (
                      <tr key={s.id} draggable={!search.trim() && sortMode === "manual" && !reordering} onDragStart={() => setDraggedId(s.id)} onDragEnd={() => setDraggedId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) void moveService(draggedId, s.id); }} className={`${tableBodyRowClass} ${draggedId === s.id ? "opacity-50" : ""}`}>
                        <td className={tableBodyCellClass}><GripVertical className={`h-5 w-5 ${search.trim() || sortMode !== "manual" ? "text-muted/30" : "cursor-grab text-muted"}`} aria-hidden /></td>
                        <td className={tableBodyCellClass}>
                          {s.image_url ? (
                            <img
                              src={s.image_url}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                        <td className={tableBodyCellClass}>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-foreground">
                              {s.name}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {s.subcatalog && (
                                <span className="inline-flex rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                                  {s.subcatalog.name}
                                </span>
                              )}
                              {s.theme && (
                                <span className="text-xs text-muted">
                                  Tema: {s.theme}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={tableBodyCellMutedClass}>
                          {s.sku ?? "—"}
                        </td>
                        <td className={tableBodyCellRightClass}>
                          ${Number(s.price).toFixed(2)}
                        </td>
                        <td className={tableBodyCellClass}>
                          <div className="flex justify-end gap-2">
                            <Link
                              href={editHref(s.id)}
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
                              onClick={() => openDeleteModal(s)}
                              disabled={deletingId === s.id}
                              className={btnDangerSmall}
                              aria-label={`Eliminar ${s.name}`}
                            >
                              <Trash2
                                className="h-3.5 w-3.5 shrink-0"
                                aria-hidden
                              />
                              {deletingId === s.id ? "..." : "Eliminar"}
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
        isOpen={serviceToDelete !== null}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Eliminar servicio"
        message={
          serviceToDelete
            ? `¿Eliminar "${serviceToDelete.name}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar"
        confirmDanger
        loading={deletingId !== null}
      />

      {activeTenant && (
        <ServiceFormSheet
          isOpen={createOpen}
          onClose={closeCreate}
          tenantId={activeTenant.id}
          initialSubcatalogId={subcatalogFilter}
          onCreated={async () => {
            await mutate();
            closeCreate();
          }}
        />
      )}
    </div>
  );
}
