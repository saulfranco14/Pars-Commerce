"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
import type { ProductListItem } from "@/types/products";
import { listByTenant, remove } from "@/services/productsService";

export default function ProductosPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] =
    useState<ProductListItem | null>(null);

  useEffect(() => {
    if (!activeTenant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    listByTenant(activeTenant.id, { type: "product" })
      .then(setProducts)
      .catch(() => setError("No se pudieron cargar los productos"))
      .finally(() => setLoading(false));
  }, [activeTenant?.id]);

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
    try {
      await remove(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setProductToDelete(null);
    } catch (e) {
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
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
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
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Crear primer producto
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-border bg-surface-raised p-4"
              >
                <div className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-border-soft">
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
                    <p className="mt-1 text-sm font-medium text-foreground">
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
                <div className="mt-3 flex gap-2 border-t border-border-soft pt-3">
                  <Link
                    href={`/dashboard/${tenantSlug}/productos/${p.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-2 text-sm font-medium text-muted-foreground hover:bg-border-soft/60"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(p)}
                    disabled={deletingId === p.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-surface py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
