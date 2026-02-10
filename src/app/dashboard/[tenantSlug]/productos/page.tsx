"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { useTenantStore } from "@/stores/useTenantStore";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
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
import type { ProductListItem } from "@/types/products";
import { remove } from "@/services/productsService";

const productsKey = (tenantId: string) =>
  `/api/products?tenant_id=${encodeURIComponent(tenantId)}&type=product`;

export default function ProductosPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] =
    useState<ProductListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const key = activeTenant ? productsKey(activeTenant.id) : null;
  const { data: productsData, error: swrError, isLoading, mutate } = useSWR<ProductListItem[]>(
    key,
    swrFetcher,
    { fallbackData: [] }
  );
  const products = Array.isArray(productsData) ? productsData : [];
  const error = actionError ?? (swrError ? "No se pudieron cargar los productos" : null);

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Productos
        </h1>
        <Link
          href={`/dashboard/${tenantSlug}/productos/nuevo`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 sm:min-h-0"
        >
          Nuevo producto
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingBlock
          variant="skeleton"
          message="Cargando productos"
          skeletonRows={6}
        />
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-8 text-center">
          <p className="text-sm text-muted">
            No hay productos. Crea uno con &quot;Nuevo producto&quot;.
          </p>
          <Link
            href={`/dashboard/${tenantSlug}/productos/nuevo`}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 active:opacity-90"
          >
            Crear primer producto
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 md:hidden">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-surface-raised p-4"
              >
                <div className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-border-soft">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-muted">
                        —
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{p.name}</p>
                    {p.theme && (
                      <p className="text-xs text-muted">Tema: {p.theme}</p>
                    )}
                    <p className="mt-1 text-base font-medium text-foreground">
                      ${Number(p.price).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted">
                      {p.unit || "unit"}
                      {p.sku ? ` · ${p.sku}` : ""}
                      {" · "}
                      Stock: {p.stock}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-3 border-t border-border-soft pt-4">
                  <Link
                    href={`/dashboard/${tenantSlug}/productos/${p.id}`}
                    className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-muted-foreground hover:bg-border-soft/60 active:opacity-90"
                  >
                    <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(p)}
                    disabled={deletingId === p.id}
                    className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-200 bg-surface py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 active:opacity-90"
                    aria-label={`Eliminar ${p.name}`}
                  >
                    <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                    {deletingId === p.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block">
            <TableWrapper>
              <table className="min-w-full">
                <thead>
                  <tr className={tableHeaderRowClass}>
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
                  {products.map((p) => (
                    <tr key={p.id} className={tableBodyRowClass}>
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
                          <span className="font-medium text-foreground">
                            {p.name}
                          </span>
                          {p.theme && (
                            <span className="text-xs text-muted">
                              Tema: {p.theme}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={tableBodyCellMutedClass}>{p.sku ?? "—"}</td>
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
                            href={`/dashboard/${tenantSlug}/productos/${p.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-border-soft/60"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(p)}
                            disabled={deletingId === p.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}
