"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { Pencil, Trash2, FolderOpen } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableBodyRowClass,
  tableBodyCellClass,
} from "@/components/ui/TableWrapper";
import { swrFetcher } from "@/lib/swrFetcher";
import type { Subcatalog } from "@/types/subcatalogs";
import {
  listByTenant,
  create,
  update,
  remove,
} from "@/services/subcatalogsService";
import { btnPrimary, btnPrimaryFlex, btnSecondary, btnIconSecondary, btnIconDanger, btnSecondarySmall, btnDangerSmall } from "@/components/ui/buttonClasses";

const subcatalogsKey = (tenantId: string) =>
  `/api/subcatalogs?tenant_id=${encodeURIComponent(tenantId)}`;

export default function SubcatalogosPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subcatalogToDelete, setSubcatalogToDelete] =
    useState<Subcatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const key = activeTenant ? subcatalogsKey(activeTenant.id) : null;
  const { data: subcatalogsData, error: swrError, isLoading, mutate } = useSWR<
    Subcatalog[]
  >(key, swrFetcher, { fallbackData: [] });
  const subcatalogs = Array.isArray(subcatalogsData) ? subcatalogsData : [];
  const listError =
    error ?? (swrError ? "No se pudieron cargar los subcatalogos" : null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!activeTenant || !newName.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await create({ tenant_id: activeTenant.id, name: newName.trim() });
      setNewName("");
      mutate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(s: Subcatalog) {
    setEditingId(s.id);
    setEditName(s.name);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await update({ subcatalog_id: editingId, name: editName.trim() });
      cancelEdit();
      mutate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setLoading(false);
    }
  }

  function openDeleteModal(s: Subcatalog) {
    setSubcatalogToDelete(s);
  }

  function closeDeleteModal() {
    if (!deletingId) setSubcatalogToDelete(null);
  }

  async function handleDeleteConfirm() {
    if (!subcatalogToDelete) return;
    const id = subcatalogToDelete.id;
    setDeletingId(id);
    setError(null);
    try {
      await remove(id);
      setSubcatalogToDelete(null);
      mutate();
    } catch (e) {
      setSubcatalogToDelete(null);
      setError(e instanceof Error ? e.message : "Error al eliminar");
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
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="space-y-4 px-2 sm:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/${tenantSlug}/productos`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Productos
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Subcatalogos
          </h1>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Agrupa productos y servicios por subcatalog para filtrar al agregar
        items a las órdenes.
      </p>

      {listError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {listError}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del subcatalog (ej. Carpas, Paredes)"
            className="min-h-[44px] flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:min-w-[200px]"
          />
          <button
            type="submit"
            disabled={loading || !newName.trim()}
            className={`${btnPrimary} shrink-0 sm:w-auto`}
          >
            {loading ? "Creando..." : "Crear"}
          </button>
        </form>
      </div>

      {isLoading ? (
        <LoadingBlock
          variant="skeleton"
          message="Cargando subcatalogos"
          skeletonRows={4}
        />
      ) : subcatalogs.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-6 text-center sm:p-8">
          <FolderOpen className="mx-auto h-10 w-10 text-muted sm:h-12 sm:w-12" aria-hidden />
          <p className="mt-4 text-sm text-muted">
            No hay subcatalogos. Crea uno para organizar productos y servicios.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {subcatalogs.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-border bg-surface-raised p-4"
              >
                {editingId === s.id ? (
                  <form
                    onSubmit={handleUpdate}
                    className="space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="min-h-[44px] w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className={btnPrimaryFlex}
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className={btnSecondary}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted mt-0.5">{s.slug}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          disabled={loading}
                          className={btnIconSecondary}
                          aria-label={`Editar ${s.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(s)}
                          disabled={deletingId === s.id}
                          className={btnIconDanger}
                          aria-label={`Eliminar ${s.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="hidden md:block">
            <TableWrapper>
              <table className="min-w-full">
                <thead>
                  <tr className={tableHeaderRowClass}>
                    <th className={tableHeaderCellClass}>Nombre</th>
                    <th className={tableHeaderCellClass}>Slug</th>
                    <th className={tableHeaderCellClass}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {subcatalogs.map((s) => (
                    <tr key={s.id} className={tableBodyRowClass}>
                      <td className={tableBodyCellClass}>
                        {editingId === s.id ? (
                          <form
                            onSubmit={handleUpdate}
                            className="flex gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm"
                              autoFocus
                            />
                            <button
                              type="submit"
                              disabled={loading}
                              className="rounded-lg bg-accent px-2 py-1.5 text-sm text-accent-foreground hover:opacity-90 disabled:opacity-50"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-lg border border-border px-2 py-1.5 text-sm text-muted hover:bg-border-soft/60"
                            >
                              Cancelar
                            </button>
                          </form>
                        ) : (
                          <span className="font-medium text-foreground">
                            {s.name}
                          </span>
                        )}
                      </td>
                      <td className={tableBodyCellClass}>
                        <span className="text-muted">{s.slug}</span>
                      </td>
                      <td className={tableBodyCellClass}>
                        {editingId !== s.id && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(s)}
                              disabled={loading}
                              className={btnSecondarySmall}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(s)}
                              disabled={deletingId === s.id}
                              className={btnDangerSmall}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingId === s.id ? "..." : "Eliminar"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={subcatalogToDelete !== null}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteConfirm}
        title="Eliminar subcatalog"
        message={
          subcatalogToDelete
            ? `¿Eliminar "${subcatalogToDelete.name}"? Los productos asignados quedarán sin subcatalog.`
            : ""
        }
        confirmLabel="Eliminar"
        confirmDanger
        loading={deletingId !== null}
      />
      </div>
    </div>
  );
}
