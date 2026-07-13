import { DollarSign, Hash, Layers, Link2, Package, Ruler, Tag } from "lucide-react";

import { listByTenant as listSubcatalogs } from "@/services/subcatalogsService";
import { deriveSlug } from "@/lib/forms/deriveSlug";

import type { CrossFieldRule, FieldSchema } from "@/lib/forms/fieldSchema";

/**
 * Declarative registration fields for "Nuevo producto" / "Editar producto".
 * Same validation rules as the former productFormSchema (validations/productForm.ts),
 * now expressed as data so SchemaFormFields renders it and useSchemaForm
 * validates it. The only slot that stays outside this list is the image
 * upload (MultiImageUpload) — it needs the real product ID from an already
 *-created record, which doesn't fit a pre-submit field declaration.
 */
interface BuildProductFieldsOptions {
  onCreateSubcatalog?: () => void;
  subcatalogsRefreshKey?: number;
}

const hasValue = (v: unknown) => v !== undefined && v !== null && v !== "";

/**
 * Cross-field rules for Producto: the wholesale pair must be set together or
 * both empty, and stock only makes sense (and is required) when track_stock
 * is on. Folded into the same Yup object as the rest of the fields — no
 * manual if-chain in the submit handler.
 */
export const productCrossFieldRules: CrossFieldRule[] = [
  {
    name: "wholesale-pair",
    message: "Cantidad mínima y precio mayoreo deben ir juntos o ambos vacíos",
    path: "wholesale_price",
    test: (values) =>
      hasValue(values.wholesale_min_quantity) ===
      hasValue(values.wholesale_price),
  },
  {
    name: "wholesale-min-quantity",
    message: "Cantidad mínima debe ser mayor o igual a 1",
    path: "wholesale_min_quantity",
    test: (values) =>
      !hasValue(values.wholesale_min_quantity) ||
      Number(values.wholesale_min_quantity) >= 1,
  },
  {
    name: "stock-required-when-tracked",
    message: "Stock es requerido cuando controlas stock",
    path: "stock",
    test: (values) => !values.track_stock || hasValue(values.stock),
  },
];

export function buildProductFields(
  tenantId: string,
  opts?: BuildProductFieldsOptions,
): FieldSchema[] {
  return [
    {
      name: "name",
      label: "Nombre",
      type: "text",
      icon: Tag,
      placeholder: "Ej. Mesa 14x10",
      required: true,
      yupString: (base) => base.trim().max(200, "Máximo 200 caracteres"),
    },
    {
      name: "slug",
      label: "Slug (URL)",
      type: "text",
      icon: Link2,
      placeholder: "mesa-14x10",
      required: false,
      hint: "Minúsculas, números y guiones.",
      derivedFrom: "name",
      deriveValue: deriveSlug,
      yupString: (base) => base.trim().max(100, "Máximo 100 caracteres"),
    },
    {
      name: "description",
      label: "Descripción",
      type: "textarea",
      required: false,
      placeholder: "Descripción del producto",
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
      label: "Costo del producto",
      type: "number",
      icon: DollarSign,
      placeholder: "0.00",
      required: true,
      hint: "Cuánto te cuesta (para calcular ganancias)",
      yupNumber: (base) => base.min(0, "El costo debe ser mayor o igual a 0"),
    },
    {
      name: "commission_amount",
      label: "Comisión por unidad",
      type: "number",
      icon: DollarSign,
      placeholder: "0.00",
      required: false,
      hint: "Comisión que se pagará por cada unidad vendida",
      yupNumber: (base) =>
        base.min(0, "La comisión debe ser mayor o igual a 0"),
    },
    {
      name: "sku",
      label: "SKU",
      type: "text",
      icon: Hash,
      placeholder: "Ej. MESA-001",
      required: false,
      hint: "Código único en inventario",
      yupString: (base) => base.trim().max(50, "Máximo 50 caracteres"),
    },
    {
      name: "unit",
      label: "Unidad",
      type: "text",
      icon: Ruler,
      placeholder: "unit, kg, pza, hora...",
      required: true,
      yupString: (base) => base.trim().max(20, "Máximo 20 caracteres"),
    },
    {
      name: "theme",
      label: "Tema o categoría",
      type: "text",
      icon: Layers,
      placeholder: "Ej. Mobiliario, Promociones",
      required: false,
      yupString: (base) => base.trim().max(100, "Máximo 100 caracteres"),
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
      name: "wholesale_min_quantity",
      label: "Mayoreo — cantidad mínima",
      type: "number",
      icon: Package,
      placeholder: "Ej. 10",
      required: false,
      hint: "Si defines mayoreo, el precio por unidad es requerido.",
    },
    {
      name: "wholesale_price",
      label: "Mayoreo — precio por unidad",
      type: "number",
      icon: DollarSign,
      placeholder: "0.00",
      required: false,
    },
    {
      name: "track_stock",
      label: "Controlar stock",
      type: "checkbox",
      required: false,
      defaultValue: true,
    },
    {
      name: "stock",
      label: "Stock inicial",
      type: "number",
      placeholder: "0",
      required: false,
      disabledUnless: "track_stock",
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

export interface ProductFieldValues {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  cost_price: number;
  commission_amount?: number;
  sku?: string;
  unit: string;
  theme?: string;
  subcatalog_id?: string;
  wholesale_min_quantity?: number;
  wholesale_price?: number;
  track_stock: boolean;
  stock?: number;
  is_public: boolean;
}
