import { AtSign, Phone, User } from "lucide-react";

import type { FieldSchema } from "@/lib/forms/fieldSchema";

/**
 * Declarative registration fields for "Nuevo cliente" — the reference modal
 * this whole homologation is modeled after. Same validation rules as the
 * former hand-written `newCustomerSchema` (loanForm.ts), now expressed as
 * data so SchemaFormFields renders it and useSchemaForm validates it without
 * a bespoke component per field.
 */
export const newCustomerFields: FieldSchema[] = [
  {
    name: "name",
    label: "Nombre",
    type: "text",
    icon: User,
    placeholder: "Nombre completo",
    required: true,
    yupString: (base) =>
      base
        .trim()
        .min(3, "Mínimo 3 caracteres")
        .max(120, "Máximo 120 caracteres")
        .matches(
          /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-'.]+$/,
          "El nombre solo puede contener letras",
        ),
  },
  {
    name: "phone",
    label: "Teléfono",
    type: "tel",
    icon: Phone,
    placeholder: "Ej: 5512345678",
    required: true,
    yupString: (base) =>
      base
        .trim()
        .min(7, "Mínimo 7 dígitos")
        .max(20, "Máximo 20 dígitos")
        .matches(/^[\d\s\-+()]+$/, "Solo números, espacios y símbolos + - ( )"),
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    icon: AtSign,
    placeholder: "correo@ejemplo.com",
    required: true,
    yupString: (base) => base.trim().max(254, "Máximo 254 caracteres"),
  },
];

export interface NewCustomerFieldValues {
  name: string;
  phone: string;
  email: string;
}
