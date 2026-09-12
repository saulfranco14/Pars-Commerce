import { DollarSign, Hash, Link2, Tag } from "lucide-react";

import { listByTenant as listSubcatalogs } from "@/services/subcatalogsService";
import { deriveSlug } from "@/lib/forms/deriveSlug";

import type { FieldSchema } from "@/lib/forms/fieldSchema";

/**
 * Declarative registration fields for "Nuevo servicio" / "Editar servicio".
 * Same validation rules as the former serviceFormSchema (validations/serviceForm.ts).
 * The only slot that stays outside this list is the image upload
 * (MultiImageUpload) — it needs the real service ID from an already-created
 * record, which doesn't fit a pre-submit field declaration.
 */
interface BuildServiceFieldsOptions {
  onCreateSubcatalog?: () => void;
  subcatalogsRefreshKey?: number;
}

export function buildServiceFields(
  tenantId: string,
  opts?: BuildServiceFieldsOptions,
): FieldSchema[] {
  return [
    {
      name: "name",
      label: "Nombre",
      type: "text",
      icon: Tag,
      placeholder: "Ej. Lavado básico",
      required: true,
      yupString: (base) => base.trim().max(200, "Máximo 200 caracteres"),
    },
    {
      name: "slug",
      label: "Slug (URL)",
      type: "text",
      icon: Link2,
      placeholder: "lavado-basico",
      required: false,
      hint: "Minúsculas, números y guiones.",
      derivedFrom: "name",
      deriveValue: deriveSlug,
      yupString: (base) => base.trim().max(200, "Máximo 200 caracteres"),
    },
    {
      name: "description",
      label: "Descripción",
      type: "textarea",
      required: false,
      placeholder: "Descripción del servicio",
      rows: 2,
      yupString: (base) => base.trim().max(2000, "Máximo 2000 caracteres"),
    },
    {
      name: "price",
      label: "Precio de venta",
      type: "number",
      icon: DollarSign,
      placeholder: "0.00",
      required: true,
      yupNumber: (base) => base.min(0, "El precio debe ser mayor o igual a 0"),
    },
    {
      name: "cost_price",
      label: "Costo del servicio",
      type: "number",
      icon: DollarSign,
      placeholder: "0.00",
      required: true,
      hint: "Cuánto te cuesta este servicio (para calcular ganancias)",
      yupNumber: (base) => base.min(0, "El costo debe ser mayor o igual a 0"),
    },
    {
      name: "commission_amount",
      label: "Comisión por unidad",
      type: "number",
      icon: DollarSign,
      placeholder: "0.00",
      required: false,
      hint: "Comisión que se pagará por cada servicio realizado",
      yupNumber: (base) =>
        base.min(0, "La comisión debe ser mayor o igual a 0"),
    },
    {
      name: "sku",
      label: "SKU",
      type: "text",
      icon: Hash,
      placeholder: "Ej. SVC-001",
      required: false,
      hint: "Código único en inventario",
      yupString: (base) => base.trim().max(50, "Máximo 50 caracteres"),
    },
    {
      name: "subcatalog_id",
      label: "Subcatálogo",
      type: "select",
      required: false,
      emptyOptionLabel: "Sin subcatálogo",
      options: async () => {
        const subcatalogs = await listSubcatalogs(tenantId);
        return subcatalogs.map((s) => ({ value: s.id, label: s.name }));
      },
      onCreateNew: opts?.onCreateSubcatalog,
      createNewLabel: "+ Crear subcatálogo",
      refreshKey: opts?.subcatalogsRefreshKey,
    },
    {
      name: "is_public",
      label: "Visible en sitio público",
      type: "checkbox",
      required: false,
      defaultValue: true,
    },
  ];
}

export interface ServiceFieldValues {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  cost_price: number;
  commission_amount?: number;
  sku?: string;
  subcatalog_id?: string;
  is_public: boolean;
}
