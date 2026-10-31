import * as yup from "yup";

import { GIRO_KEYS } from "@/features/growth/constants/giroCopy";
import { normalizeMexicanPhone } from "@/lib/phone";

const optionalPhone = (message: string) =>
  yup
    .string()
    .trim()
    .default("")
    .test("mx-phone", message, (value) => !value || normalizeMexicanPhone(value) !== null);

export const memberSchema = yup.object({
  display_name: yup.string().trim().min(2, "Mínimo 2 caracteres.").max(80, "Máximo 80 caracteres.").required("Escribe su nombre."),
  email: yup.string().trim().email("Escribe un correo válido.").required("Escribe su correo."),
  whatsapp: optionalPhone("Escribe los 10 dígitos de su WhatsApp."),
  signature: yup.string().trim().max(80, "Máximo 80 caracteres.").default(""),
  role: yup.mixed<"coordinador" | "prospector">().oneOf(["coordinador", "prospector"]).required(),
  daily_goal: yup.number().typeError("Escribe un número.").integer().min(1, "Mínimo 1.").max(200, "Máximo 200.").required(),
});

export type MemberFormValues = yup.InferType<typeof memberSchema>;

export const newLeadSchema = yup.object({
  business_name: yup.string().trim().min(2, "Escribe el nombre del negocio.").max(160, "Máximo 160 caracteres.").required("Escribe el nombre del negocio."),
  phone: optionalPhone("Escribe los 10 dígitos del teléfono."),
  email: yup.string().trim().email("Escribe un correo válido.").default(""),
  giro: yup.string().oneOf(GIRO_KEYS, "Elige un giro.").required("Elige un giro."),
  municipio: yup.string().trim().max(80).required("Escribe el municipio."),
  colonia: yup.string().trim().max(80).default(""),
  source_detail: yup.mixed<"visita" | "referido" | "redes" | "otro">().oneOf(["visita", "referido", "redes", "otro"]).required(),
  note: yup.string().trim().max(280, "Máximo 280 caracteres.").default(""),
}).test("contact", "Escribe al menos el teléfono o el correo.", function (value) {
  return Boolean(value.phone || value.email) || this.createError({ path: "phone", message: "Escribe al menos el teléfono o el correo." });
});

export type NewLeadFormValues = yup.InferType<typeof newLeadSchema>;

export const leadRegistrationSchema = yup.object({
  business_name: yup.string().trim().min(2, "Escribe el nombre del negocio.").max(160).required("Escribe el nombre del negocio."),
  owner_name: yup.string().trim().min(2, "Escribe el nombre del dueño.").max(80).required("Escribe el nombre del dueño."),
  owner_email: yup.string().trim().email("Escribe un correo válido.").required("Escribe su correo: ahí le llega su acceso."),
  owner_phone: optionalPhone("Escribe los 10 dígitos de su teléfono."),
});

export type LeadRegistrationFormValues = yup.InferType<typeof leadRegistrationSchema>;
