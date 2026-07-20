import { Building2, CreditCard, Hash, User } from "lucide-react";

import type { FieldSchema } from "@/lib/forms/fieldSchema";

/**
 * Declarative registration fields for "Nueva cuenta bancaria" / "Editar
 * cuenta bancaria". Same validation rules as the former bankAccountSchema
 * (Yup object) — now expressed as data so SchemaFormFields renders it and
 * useSchemaForm validates it. The CLABE-duplicate check stays out of this
 * declaration: it depends on the tenant's existing accounts list, which
 * isn't available at field-declaration time — it's still enforced in
 * useBankAccounts (isClabeDuplicated) before the API call.
 */
export const bankAccountFields: FieldSchema[] = [
  {
    name: "label",
    label: "Nombre de la cuenta",
    type: "text",
    icon: CreditCard,
    placeholder: "Ej. Cuenta principal BBVA",
    required: true,
  },
  {
    name: "bank_name",
    label: "Banco",
    type: "text",
    icon: Building2,
    placeholder: "Ej. BBVA, Banorte, HSBC",
    required: true,
  },
  {
    name: "account_holder",
    label: "Titular de la cuenta",
    type: "text",
    icon: User,
    placeholder: "Nombre completo del titular",
    required: true,
  },
  {
    name: "clabe",
    label: "CLABE interbancaria",
    type: "text",
    icon: Hash,
    placeholder: "18 dígitos",
    required: true,
    yupString: (base) =>
      base
        .trim()
        .matches(/^\d{18}$/, "La CLABE debe tener exactamente 18 dígitos"),
  },
  {
    name: "account_number",
    label: "Número de cuenta",
    type: "text",
    placeholder: "Ej. 1234567890",
    required: false,
  },
];

export interface BankAccountFieldValues {
  label: string;
  bank_name: string;
  account_holder: string;
  clabe: string;
  account_number?: string;
}
