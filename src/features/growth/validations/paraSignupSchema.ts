import * as yup from "yup";

import { isValidMexicanPhone } from "@/lib/phone";

import type { ParaSignupValues } from "@/features/growth/interfaces/paraAds";

export const paraSignupSchema: yup.ObjectSchema<ParaSignupValues> = yup.object({
  businessName: yup.string().trim().min(2, "Escriba el nombre de su negocio.").max(80, "Máximo 80 letras.").required("Escriba el nombre de su negocio."),
  phone: yup.string().required("Escriba su WhatsApp.").test("mx-phone", "Escriba los 10 dígitos de su WhatsApp.", (value) => isValidMexicanPhone(value ?? "")),
  email: yup.string().trim().email("Escriba un correo válido.").required("Escriba su correo."),
  password: yup.string().min(8, "Mínimo 8 caracteres.").required("Escriba una contraseña."),
});
