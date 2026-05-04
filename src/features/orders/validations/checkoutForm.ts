import * as yup from "yup";

export const checkoutFormSchema = yup.object({
  customer_name: yup
    .string()
    .trim()
    .required("El nombre es obligatorio")
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres"),
  customer_email: yup
    .string()
    .trim()
    .required("El email es obligatorio")
    .email("Email inválido")
    .max(254, "Máximo 254 caracteres"),
  customer_phone: yup
    .string()
    .trim()
    .required("El teléfono es obligatorio")
    .matches(/^\d+$/, "Solo dígitos, sin espacios ni símbolos")
    .min(10, "Mínimo 10 dígitos")
    .max(12, "Máximo 12 dígitos"),
});

export type CheckoutFormValues = yup.InferType<typeof checkoutFormSchema>;
