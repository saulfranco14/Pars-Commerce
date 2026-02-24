import * as yup from "yup";

export const serviceFormSchema = yup.object({
  name: yup
    .string()
    .required("El nombre es requerido")
    .trim()
    .max(200, "Máximo 200 caracteres"),
  slug: yup
    .string()
    .required("El slug es requerido")
    .trim()
    .matches(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones")
    .max(200, "Máximo 200 caracteres"),
  description: yup
    .string()
    .trim()
    .max(2000, "Máximo 2000 caracteres")
    .transform((v) => (v === "" ? undefined : v)),
  price: yup
    .number()
    .required("El precio es requerido")
    .min(0, "El precio debe ser mayor o igual a 0"),
  cost_price: yup
    .number()
    .required("El costo es requerido")
    .min(0, "El costo debe ser mayor o igual a 0"),
  sku: yup.string().trim().max(50, "Máximo 50 caracteres"),
});
