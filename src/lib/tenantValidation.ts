import * as yup from "yup";
import { BUSINESS_TYPES } from "@/constants/businessTypes";

const businessTypeValues = BUSINESS_TYPES.map((bt) => bt.value);

export const crearNegocioSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("El nombre del negocio es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(200, "Máximo 200 caracteres"),
  slug: yup
    .string()
    .trim()
    .required("El slug es obligatorio")
    .min(2, "El slug debe tener al menos 2 caracteres")
    .matches(
      /^[a-z0-9-]+$/,
      "Solo minúsculas, números y guiones"
    )
    .max(100, "Máximo 100 caracteres"),
  business_type: yup
    .string()
    .trim()
    .required("Selecciona un tipo de negocio")
    .oneOf(businessTypeValues, "Tipo de negocio no válido"),
});

export type CrearNegocioFormValues = yup.InferType<typeof crearNegocioSchema>;
