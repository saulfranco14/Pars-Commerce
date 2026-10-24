import { z } from "zod";

const RFC_PATTERN = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const MEXICAN_PHONE_PATTERN = /^(?:\+52)?\d{10}$/;

export const legalProfileSchema = z
  .object({
    party_type: z.enum(["individual", "company"]),
    legal_name: z.string().trim().min(3, "Escribe el nombre legal completo."),
    tax_id: z
      .string()
      .trim()
      .toUpperCase()
      .regex(RFC_PATTERN, "Revisa el RFC; usa 12 o 13 caracteres sin espacios."),
    address_line1: z.string().trim().min(5, "Escribe calle, número y colonia."),
    address_line2: z.string().trim(),
    city: z.string().trim().min(2, "Escribe la ciudad."),
    state: z.string().trim().min(2, "Escribe el estado."),
    postal_code: z.string().trim().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos."),
    country: z.string().trim().min(2),
    contractual_email: z.string().trim().email("Escribe un correo válido."),
    contractual_phone: z
      .string()
      .trim()
      .regex(MEXICAN_PHONE_PATTERN, "Escribe un teléfono mexicano de 10 dígitos."),
    representative_name: z.string().trim(),
    representative_role: z.string().trim(),
    public_seller_name: z.string().trim().min(2, "Escribe el nombre que verá tu cliente."),
    public_privacy_contact: z
      .string()
      .trim()
      .min(5, "Comparte un correo o teléfono de contacto.")
      .refine(
        (value) => z.email().safeParse(value).success || MEXICAN_PHONE_PATTERN.test(value.replace(/[\s()-]/g, "")),
        "Escribe un correo o teléfono de contacto válido.",
      ),
  })
  .superRefine((profile, context) => {
    if (profile.party_type !== "company") return;
    if (!profile.representative_name) {
      context.addIssue({ code: "custom", path: ["representative_name"], message: "Escribe el nombre de la persona representante." });
    }
    if (!profile.representative_role) {
      context.addIssue({ code: "custom", path: ["representative_role"], message: "Indica su cargo o facultad." });
    }
  });

export type LegalProfileForm = z.input<typeof legalProfileSchema>;
export type LegalProfileField = keyof LegalProfileForm;

export function getLegalProfileFieldErrors(input: LegalProfileForm) {
  const result = legalProfileSchema.safeParse(input);
  if (result.success) return {} as Partial<Record<LegalProfileField, string>>;
  return result.error.issues.reduce<Partial<Record<LegalProfileField, string>>>((errors, issue) => {
    const field = issue.path[0] as LegalProfileField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
}
