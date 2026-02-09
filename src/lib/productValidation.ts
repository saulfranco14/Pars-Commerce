import * as yup from "yup";

export const productFormSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("El nombre es obligatorio")
    .max(200, "Máximo 200 caracteres"),
  slug: yup
    .string()
    .trim()
    .required("El slug es obligatorio")
    .matches(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones")
    .max(100, "Máximo 100 caracteres"),
  description: yup.string().trim().max(2000, "Máximo 2000 caracteres"),
  price: yup
    .number()
    .required("El precio es obligatorio")
    .min(0, "El precio debe ser mayor o igual a 0")
    .typeError("Ingresa un número válido"),
  cost_price: yup
    .number()
    .required("El costo es requerido")
    .min(0, "El costo debe ser mayor o igual a 0")
    .typeError("Ingresa un número válido"),
  sku: yup.string().trim().max(50, "Máximo 50 caracteres"),
  unit: yup
    .string()
    .trim()
    .required("La unidad es obligatoria")
    .max(20, "Máximo 20 caracteres"),
  theme: yup
    .string()
    .trim()
    .max(100, "Máximo 100 caracteres")
    .transform((v) => (v === "" ? undefined : v)),
});

export type ProductFormValues = yup.InferType<typeof productFormSchema>;
