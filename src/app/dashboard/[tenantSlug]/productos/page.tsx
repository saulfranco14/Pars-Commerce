"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenantStore } from "@/stores/useTenantStore";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
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
      <div className="text-sm text-zinc-600">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">
          Productos
        </h1>
        <Link
          href={`/dashboard/${tenantSlug}/productos/nuevo`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 sm:min-h-0"
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
        <p className="text-sm text-zinc-500">Cargando productos...</p>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
          <p className="text-sm text-zinc-500">
            No hay productos. Crea uno con &quot;Nuevo producto&quot;.
          </p>
          <Link
            href={`/dashboard/${tenantSlug}/productos/nuevo`}
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
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
                className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                        —
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">{p.name}</p>
                    {p.theme && (
                      <p className="text-xs text-zinc-500">Tema: {p.theme}</p>
                    )}
                    <p className="mt-1 text-sm font-medium text-zinc-900">
                      ${Number(p.price).toFixed(2)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {p.unit || "unit"}
                      {p.sku ? ` · ${p.sku}` : ""}
                      {" · "}
                      Stock: {p.stock}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3">
                  <Link
                    href={`/dashboard/${tenantSlug}/productos/${p.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(p)}
                    disabled={deletingId === p.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === p.id ? "..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Imagen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Unidad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Precio
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/50">
                      <td className="px-4 py-3">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-zinc-900">
                            {p.name}
                          </span>
                          {p.theme && (
                            <span className="text-xs text-zinc-500">
                              Tema: {p.theme}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {p.sku ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {p.unit || "unit"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600">
                        {p.stock}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/${tenantSlug}/productos/${p.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(p)}
                            disabled={deletingId === p.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
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
            </div>
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
