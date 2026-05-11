import * as yup from "yup";

export const paymentAmountSchema = yup.object({
  customer_name: yup.string().trim().required("Ingresa tu nombre"),
  customer_email: yup
    .string()
    .trim()
    .email("Correo inválido")
    .required("Ingresa tu correo"),
  amount: yup
    .number()
    .typeError("Monto inválido")
    .positive("El monto debe ser mayor a 0")
    .required("Ingresa el monto"),
});

export type PaymentAmountValues = yup.InferType<typeof paymentAmountSchema>;
