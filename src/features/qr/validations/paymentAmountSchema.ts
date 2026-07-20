import * as yup from "yup";

export const paymentAmountSchema = yup.object({
  customer_name: yup
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .max(60, "Máximo 60 caracteres")
    .notRequired()
    .default(undefined),
  customer_email: yup
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .email("Correo inválido")
    .notRequired()
    .default(undefined),
  amount: yup
    .number()
    .typeError("Monto inválido")
    .positive("El monto debe ser mayor a 0")
    .required("Ingresa el monto"),
});

export type PaymentAmountValues = yup.InferType<typeof paymentAmountSchema>;
