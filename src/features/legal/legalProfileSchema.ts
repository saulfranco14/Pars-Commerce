import { z } from "zod";

import { isValidMexicanPhone } from "@/lib/phone";

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
      .refine((value) => !value || RFC_PATTERN.test(value), "Revisa el RFC; usa 12 o 13 caracteres sin espacios."),
    address_line1: z
      .string()
      .trim()
      .min(5, "Escribe calle, número y colonia.")
      .refine((value) => /\d/.test(value), "Incluye el número exterior de tu domicilio."),
    address_line2: z.string().trim(),
    address_place_id: z.string().trim(),
    address_latitude: z.number().finite().nullable(),
    address_longitude: z.number().finite().nullable(),
    city: z.string().trim(),
    state: z.string().trim(),
    postal_code: z.string().trim().refine((value) => !value || /^\d{5}$/.test(value), "El código postal debe tener 5 dígitos."),
    country: z.string().trim().min(2),
    contractual_email: z.string().trim().refine((value) => !value || z.email().safeParse(value).success, "Escribe un correo válido."),
    contractual_phone: z
      .string()
      .trim()
      .refine(isValidMexicanPhone, "Escribe un teléfono mexicano de 10 dígitos."),
    representative_name: z.string().trim(),
    representative_role: z.string().trim(),
    public_seller_name: z.string().trim(),
    public_privacy_contact: z
      .string()
      .trim()
      .refine(
        (value) => !value || z.email().safeParse(value).success || MEXICAN_PHONE_PATTERN.test(value.replace(/[\s()-]/g, "")),
        "Escribe un correo o teléfono de contacto válido.",
      ),
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
