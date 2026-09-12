import { FolderTree } from "lucide-react";

import type { FieldSchema } from "@/lib/forms/fieldSchema";

/**
 * Declarative registration fields for "Nuevo subcatálogo" / "Editar
 * subcatálogo" — the JSON-driven form example. Adding a field (e.g. a
 * description) later means adding one entry here; SchemaFormFields and the
 * Yup validation both pick it up automatically.
 */
export const subcatalogFields: FieldSchema[] = [
  {
    name: "name",
    label: "Nombre",
    type: "text",
    icon: FolderTree,
    placeholder: "Ej. Carpas, Paredes",
    required: true,
  },
];

export interface SubcatalogFormValues {
  name: string;
}
