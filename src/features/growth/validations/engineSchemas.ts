import * as yup from "yup";

import { SEND_HOUR_MAX, SEND_HOUR_MIN } from "@/features/growth/constants/sendWindow";
import { normalizeMexicanPhone } from "@/lib/phone";

export const mailboxSchema = yup.object({
  address: yup.string().trim().email("Escribe un correo válido.").required("El correo es obligatorio."),
  display_name: yup.string().trim().min(2, "Mínimo 2 caracteres.").max(60, "Máximo 60 caracteres.").required("El nombre es obligatorio."),
  secret_env_key: yup
    .string()
    .trim()
    .matches(/^GROWTH_MAILBOX_[A-Z0-9_]+$/, "Escribe solo el nombre, sin «=» ni la contraseña. Ejemplo: GROWTH_MAILBOX_1_PASSWORD.")
    .required("La variable es obligatoria."),
  daily_cap: yup.number().typeError("Escribe un número.").integer().min(1, "Mínimo 1.").max(100, "Máximo 100.").required(),
});

export type MailboxFormValues = yup.InferType<typeof mailboxSchema>;

export const engineSettingsSchema = yup.object({
  signature: yup.string().trim().min(2, "Mínimo 2 caracteres.").max(60, "Máximo 60 caracteres.").required("La firma es obligatoria."),
  send_start_hour: yup.number().typeError("Escribe una hora.").integer().min(SEND_HOUR_MIN, `Desde las ${SEND_HOUR_MIN}:00.`).max(SEND_HOUR_MAX - 1).required(),
  send_end_hour: yup
    .number()
    .typeError("Escribe una hora.")
    .integer()
    .max(SEND_HOUR_MAX, `Hasta las ${SEND_HOUR_MAX}:00.`)
    .moreThan(yup.ref("send_start_hour"), "Debe terminar después de empezar.")
    .required(),
});

export type EngineSettingsFormValues = yup.InferType<typeof engineSettingsSchema>;

export const leadPhoneSchema = yup.object({
  phone: yup
    .string()
    .trim()
    .required("Escribe el teléfono.")
    .test("mx-phone", "Escribe los 10 dígitos del teléfono.", (value) => normalizeMexicanPhone(value ?? "") !== null),
});

export type LeadPhoneFormValues = yup.InferType<typeof leadPhoneSchema>;
