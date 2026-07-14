"use client";

import { useEffect, useId, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Plus, Pencil, Trash2, FolderOpen, FolderTree } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { FAB } from "@/components/ui/FAB";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { FormSheet } from "@/components/ui/FormSheet";
import {
  TableWrapper,
  tableHeaderRowClass,
  tableHeaderCellClass,
  tableBodyRowClass,
  tableBodyCellClass,
} from "@/components/ui/TableWrapper";
import { swrFetcher } from "@/lib/swrFetcher";
import { isAbortError } from "@/services/apiFetch";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { SchemaFormFields } from "@/lib/forms/SchemaFormFields";
import {
  subcatalogFields,
  type SubcatalogFormValues,
} from "@/features/productos/validations/subcatalogFieldSchema";
import type { Subcatalog } from "@/types/subcatalogs";
import { create, update, remove } from "@/services/subcatalogsService";
import {
  btnPrimaryFlex,
  btnSecondary,
  btnIconSecondary,
  btnIconDanger,
  btnSecondarySmall,
  btnDangerSmall,
} from "@/components/ui/buttonClasses";
import { useActiveTenant } from "@/stores/useTenantStore";

const subcatalogsKey = (tenantId: string) =>
  `/api/subcatalogs?tenant_id=${encodeURIComponent(tenantId)}`;

export default function SubcatalogosPage() {
  const createFormId = useId();
  const editFormId = useId();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subcatalogToDelete, setSubcatalogToDelete] =
    useState<Subcatalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const key = activeTenant ? subcatalogsKey(activeTenant.id) : null;
  const {
    data: subcatalogsData,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR<Subcatalog[]>(key, swrFetcher, { fallbackData: [] });
  const subcatalogs = Array.isArray(subcatalogsData) ? subcatalogsData : [];
  const listError =
    error ??
    (swrError && !isAbortError(swrError)
      ? "No se pudieron cargar los subcatalogos"
      : null);
  const editingSubcatalog = subcatalogs.find((s) => s.id === editingId) ?? null;

  // Create sheet — same JSON-driven form the "Editar" sheet below reuses.
  // Supports ?nuevo=1 so old/bookmarked links still land on the new modal.
  const [createOpen, setCreateOpen] = useState(false);
  useEffect(() => {
    if (searchParams.get("nuevo") === "1") setCreateOpen(true);
  }, [searchParams]);

  function closeCreate() {
    setCreateOpen(false);
    if (searchParams.get("nuevo") === "1") {
      router.replace(`/dashboard/${tenantSlug}/productos/subcatalogos`);
    }
  }

  const createForm = useSchemaForm<SubcatalogFormValues>(
    subcatalogFields,
    async (values) => {
      if (!activeTenant) return;
      await create({ tenant_id: activeTenant.id, name: values.name.trim() });
      await mutate();
      closeCreate();
    },
  );

  const editForm = useSchemaForm<SubcatalogFormValues>(
    subcatalogFields,
    async (values) => {
      if (!editingId) return;
      await update({ subcatalog_id: editingId, name: values.name.trim() });
      await mutate();
      setEditingId(null);
    },
  );

  function startEdit(s: Subcatalog) {
    setError(null);
    setEditingId(s.id);
    editForm.resetForm();
    editForm.setValue("name" as never, s.name as never);
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
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/${tenantSlug}/productos`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Productos
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
            Subcatálogos
          </h1>
        </div>

        <p className="text-sm text-muted-foreground">
          Agrupa productos y servicios por subcatálogo para filtrar al
          agregar items a las órdenes.
        </p>

        {/* Único punto de creación — FAB en móvil y desktop. */}
        <FAB
          onClick={() => setCreateOpen(true)}
          aria-label="Nuevo subcatálogo"
          alwaysVisible
        >
          <Plus className="h-6 w-6 shrink-0" aria-hidden />
        </FAB>

        {listError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </div>
        )}

        {isLoading ? (
          <LoadingBlock
            variant="skeleton"
            message="Cargando subcatalogos"
            skeletonRows={4}
          />
        ) : subcatalogs.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-raised p-6 text-center sm:p-8">
            <FolderOpen
              className="mx-auto h-10 w-10 text-muted sm:h-12 sm:w-12"
              aria-hidden
            />
            <p className="mt-4 text-sm text-muted">
              No hay subcatalogos. Crea uno para organizar productos y
              servicios.
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
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted mt-0.5">{s.slug}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
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
                          <span className="font-medium text-foreground">
                            {s.name}
                          </span>
                        </td>
                        <td className={tableBodyCellClass}>
                          <span className="text-muted">{s.slug}</span>
                        </td>
                        <td className={tableBodyCellClass}>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(s)}
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrapper>
            </div>
          </>
        )}

        {/* Create sheet — JSON-schema-driven, icon-chip header. */}
        <FormSheet
          isOpen={createOpen}
          onClose={closeCreate}
          icon={FolderTree}
          title="Nuevo subcatálogo"
          description="Agrupa productos y servicios similares."
          footer={
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                form={createFormId}
                disabled={createForm.submitting || !createForm.isValid}
                className={btnPrimaryFlex}
              >
                {createForm.submitting ? "Creando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={closeCreate}
                className={btnSecondary}
              >
                Cancelar
              </button>
            </div>
          }
        >
          <form
            id={createFormId}
            onSubmit={createForm.handleSubmit(createForm.submit)}
            noValidate
            className="space-y-4"
          >
            <SchemaFormFields
              fields={subcatalogFields}
              register={createForm.register}
              errors={createForm.errors}
            />
            {createForm.submitError && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {createForm.submitError}
              </div>
            )}
          </form>
        </FormSheet>

        {/* Edit sheet — same schema/fields, different submit target. */}
        <FormSheet
          isOpen={editingId !== null}
          onClose={() => setEditingId(null)}
          icon={FolderTree}
          title="Editar subcatálogo"
          description={editingSubcatalog?.name}
          footer={
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                form={editFormId}
                disabled={editForm.submitting || !editForm.isValid}
                className={btnPrimaryFlex}
              >
                {editForm.submitting ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className={btnSecondary}
              >
                Cancelar
              </button>
            </div>
          }
        >
          <form
            id={editFormId}
            onSubmit={editForm.handleSubmit(editForm.submit)}
            noValidate
            className="space-y-4"
          >
            <SchemaFormFields
              fields={subcatalogFields}
              register={editForm.register}
              errors={editForm.errors}
            />
            {editForm.submitError && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {editForm.submitError}
              </div>
            )}
          </form>
        </FormSheet>

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
