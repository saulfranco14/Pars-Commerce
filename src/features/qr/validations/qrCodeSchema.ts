import * as yup from "yup";

export const qrCodeSchema = yup.object({
  kind: yup
    .mixed<"payment" | "table">()
    .oneOf(["payment", "table"])
    .required(),
  label: yup.string().trim().required("Ingresa la etiqueta"),
  table_capacity: yup
    .number()
    .transform((v, o) => (o === "" || o === null ? null : v))
    .nullable()
    .when("kind", {
      is: "table",
      then: (s) =>
        s
          .typeError("Ingresa una capacidad válida")
          .min(1, "La capacidad debe ser al menos 1")
          .required("Ingresa la capacidad de la mesa"),
      otherwise: (s) => s.nullable(),
    }),
  preset_amount: yup
    .number()
    .transform((v, o) => (o === "" || o === null ? null : v))
    .nullable()
    .when("kind", {
      is: "payment",
      then: (s) =>
        s
          .typeError("Ingresa un monto válido")
          .min(0, "El monto no puede ser negativo")
          .nullable(),
      otherwise: (s) => s.nullable(),
    }),
  preset_concept: yup.string().nullable(),
  allow_amount_override: yup.boolean().default(true),
});

export type QrCodeFormValues = yup.InferType<typeof qrCodeSchema>;
