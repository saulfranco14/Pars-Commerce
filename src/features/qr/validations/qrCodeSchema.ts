import * as yup from "yup";

export const qrCodeSchema = yup.object({
  kind: yup
    .mixed<"payment" | "table">()
    .oneOf(["payment", "table"])
    .required(),
  label: yup.string().trim().required("Ingresa la etiqueta"),
  table_capacity: yup.number().nullable(),
  preset_amount: yup.number().nullable(),
  preset_concept: yup.string().nullable(),
  allow_amount_override: yup.boolean().default(true),
});

export type QrCodeFormValues = yup.InferType<typeof qrCodeSchema>;
