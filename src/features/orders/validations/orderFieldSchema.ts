import { Mail, Phone, User, Users } from "lucide-react";

import { list as listTeam } from "@/services/teamService";

import type { FieldSchema } from "@/lib/forms/fieldSchema";

/**
 * Declarative fields for "Nueva orden" — same shape as buildProductFields:
 * data, not hand-rolled useState per input. All fields optional (customer
 * data can be added/edited later from the order detail).
 */
export function buildOrderFields(tenantId: string): FieldSchema[] {
  return [
    {
      name: "customer_name",
      label: "Nombre",
      type: "text",
      icon: User,
      placeholder: "Nombre del cliente",
      required: false,
      yupString: (base) => base.trim().max(200, "Máximo 200 caracteres"),
    },
    {
      name: "customer_email",
      label: "Email",
      type: "email",
      icon: Mail,
      placeholder: "cliente@ejemplo.com",
      required: false,
    },
    {
      name: "customer_phone",
      label: "Teléfono",
      type: "tel",
      icon: Phone,
      placeholder: "555 123 4567",
      required: false,
      yupString: (base) => base.trim().max(30, "Máximo 30 caracteres"),
    },
    {
      name: "assigned_to",
      label: "Asignar a miembro",
      type: "select",
      icon: Users,
      required: false,
      emptyOptionLabel: "Sin asignar",
      options: async () => {
        const team = await listTeam(tenantId);
        return team.map((t) => ({
          value: t.user_id,
          label: t.display_name || t.email,
        }));
      },
    },
  ];
}

export interface OrderFieldValues {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  assigned_to?: string;
}
