"use client";

import { useId, useRef, useState } from "react";

import { FolderTree, Wrench } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { btnPrimaryFlex, btnSecondary } from "@/components/ui/buttonClasses";
import {
  MultiImageUpload,
  type MultiImageUploadRef,
} from "@/components/MultiImageUpload";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { SchemaFormFields } from "@/lib/forms/SchemaFormFields";
import { buildServiceFields } from "@/features/servicios/validations/serviceFieldSchema";
import {
  subcatalogFields,
  type SubcatalogFormValues,
} from "@/features/productos/validations/subcatalogFieldSchema";
import { createServiceFromForm } from "@/features/servicios/services/serviceAdapter";
import { create as createSubcatalog } from "@/services/subcatalogsService";

import type { ServiceFieldValues } from "@/features/servicios/validations/serviceFieldSchema";

interface ServiceFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onCreated: () => void;
}

/**
 * "Nuevo servicio" — homologated onto the schema-driven engine, same
 * icon-chip FormSheet used by Producto/Subcatálogo/Nuevo cliente. Every
 * field (including slug auto-derivation) is declared in
 * serviceFieldSchema.ts; this component only orchestrates the form hook, the
 * image-upload slot, and the nested "+ Crear subcatálogo" sheet.
 */
export function ServiceFormSheet({
  isOpen,
  onClose,
  tenantId,
  onCreated,
}: ServiceFormSheetProps) {
  const formId = useId();
  const newSubcatalogFormId = useId();
  const imageUploadRef = useRef<MultiImageUploadRef>(null);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newSubcatalogOpen, setNewSubcatalogOpen] = useState(false);
  const [subcatalogsRefreshKey, setSubcatalogsRefreshKey] = useState(0);

  const fields = buildServiceFields(tenantId, {
    onCreateSubcatalog: () => setNewSubcatalogOpen(true),
    subcatalogsRefreshKey,
  });

  const form = useSchemaForm<ServiceFieldValues>(fields, async (values) => {
    await createServiceFromForm(tenantId, values, imageUploadRef.current);
    setImageUrls([]);
    onCreated();
  });

  const newSubcatalogForm = useSchemaForm<SubcatalogFormValues>(
    subcatalogFields,
    async (values) => {
      const created = await createSubcatalog({
        tenant_id: tenantId,
        name: values.name.trim(),
      });
      form.setValue("subcatalog_id" as never, created.id as never);
      setSubcatalogsRefreshKey((k) => k + 1);
      newSubcatalogForm.resetForm();
      setNewSubcatalogOpen(false);
    },
  );

  function handleClose() {
    form.resetForm();
    setImageUrls([]);
    onClose();
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={handleClose}
      icon={Wrench}
      title="Nuevo servicio"
      description="Agrega un servicio a tu catálogo"
      maxWidth="max-w-xl"
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            form={formId}
            disabled={form.submitting || !form.isValid}
            className={btnPrimaryFlex}
          >
            {form.submitting ? "Creando..." : "Guardar"}
          </button>
          <button type="button" onClick={handleClose} className={btnSecondary}>
            Cancelar
          </button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={form.handleSubmit(form.submit)}
        noValidate
        className="space-y-4"
      >
        <SchemaFormFields
          fields={fields}
          register={form.register}
          errors={form.errors}
          watch={form.watch}
        />

        <div>
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Imágenes
            <span className="ml-1 font-medium normal-case text-muted-foreground/60">
              (opcional)
            </span>
          </span>
          <div className="rounded-2xl border-2 border-border p-4">
            <MultiImageUpload
              ref={imageUploadRef}
              tenantId={tenantId}
              urls={imageUrls}
              onChange={setImageUrls}
            />
          </div>
        </div>

        {form.submitError && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {form.submitError}
          </div>
        )}
      </form>

      {/* Nested sheet — "+ Crear subcatálogo" from the select above, without
          closing this service form. */}
      <FormSheet
        isOpen={newSubcatalogOpen}
        onClose={() => {
          newSubcatalogForm.resetForm();
          setNewSubcatalogOpen(false);
        }}
        icon={FolderTree}
        title="Nuevo subcatálogo"
        description="Agrupa productos y servicios similares."
        footer={
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              form={newSubcatalogFormId}
              disabled={
                newSubcatalogForm.submitting || !newSubcatalogForm.isValid
              }
              className={btnPrimaryFlex}
            >
              {newSubcatalogForm.submitting ? "Creando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                newSubcatalogForm.resetForm();
                setNewSubcatalogOpen(false);
              }}
              className={btnSecondary}
            >
              Cancelar
            </button>
          </div>
        }
      >
        <form
          id={newSubcatalogFormId}
          onSubmit={newSubcatalogForm.handleSubmit(newSubcatalogForm.submit)}
          noValidate
          className="space-y-4"
        >
          <SchemaFormFields
            fields={subcatalogFields}
            register={newSubcatalogForm.register}
            errors={newSubcatalogForm.errors}
          />
          {newSubcatalogForm.submitError && (
            <div
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {newSubcatalogForm.submitError}
            </div>
          )}
        </form>
      </FormSheet>
    </FormSheet>
  );
}
