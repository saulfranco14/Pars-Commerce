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

export default function ServiciosPage() {
  const params = useParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useTenantStore((s) => s.activeTenant)();
  const [services, setServices] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] =
    useState<ProductListItem | null>(null);

  useEffect(() => {
    if (!activeTenant) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    listByTenant(activeTenant.id, { type: "service" })
      .then(setServices)
      .catch(() => setError("No se pudieron cargar los servicios"))
      .finally(() => setLoading(false));
  }, [activeTenant?.id]);

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
    try {
      await remove(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
      setServiceToDelete(null);
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
          Servicios
        </h1>
        <Link
          href={`/dashboard/${tenantSlug}/servicios/nuevo`}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:opacity-90 sm:min-h-0"
        >
          Nuevo servicio
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
          message="Cargando servicios"
          skeletonRows={6}
        />
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-8 text-center">
          <p className="text-sm text-muted">
            No hay servicios. Crea uno con &quot;Nuevo servicio&quot;.
          </p>
          <Link
            href={`/dashboard/${tenantSlug}/servicios/nuevo`}
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            Crear primer servicio
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {services.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-border bg-surface-raised p-4 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-border-soft">
                    {s.image_url ? (
                      <img
                        src={s.image_url}
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
                    <p className="font-medium text-foreground">{s.name}</p>
                    {s.theme && (
                      <p className="text-xs text-muted">Tema: {s.theme}</p>
                    )}
                    <p className="mt-1 text-sm font-medium text-foreground">
                      ${Number(s.price).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted">
                      {s.sku ? `SKU: ${s.sku}` : "Sin SKU"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 border-t border-border-soft pt-3">
                  <Link
                    href={`/dashboard/${tenantSlug}/servicios/${s.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface py-2 text-sm font-medium text-muted-foreground hover:bg-border-soft/60"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => openDeleteModal(s)}
                    disabled={deletingId === s.id}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === s.id ? "..." : "Eliminar"}
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
                    <th className={tableHeaderCellRightClass}>Precio</th>
                    <th className={tableHeaderCellRightClass}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className={tableBodyRowClass}>
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
                          {s.theme && (
                            <span className="text-xs text-muted">
                              Tema: {s.theme}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={tableBodyCellMutedClass}>{s.sku ?? "—"}</td>
                      <td className={tableBodyCellRightClass}>
                        ${Number(s.price).toFixed(2)}
                      </td>
                      <td className={tableBodyCellClass}>
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/${tenantSlug}/servicios/${s.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-border-soft/60"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Editar
                          </Link>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(s)}
                            disabled={deletingId === s.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}
