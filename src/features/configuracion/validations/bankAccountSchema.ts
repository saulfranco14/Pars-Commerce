import * as yup from "yup";

export const bankAccountSchema = yup.object({
  label: yup.string().trim().required("Ingresa un nombre para la cuenta"),
  bank_name: yup.string().trim().required("Ingresa el nombre del banco"),
  account_holder: yup.string().trim().required("Ingresa el nombre del titular"),
  clabe: yup
    .string()
    .trim()
    .matches(/^\d{18}$/, "La CLABE debe tener exactamente 18 dígitos")
    .required("Ingresa la CLABE interbancaria"),
  account_number: yup.string().trim().nullable().default(null),
});

export type BankAccountFormValues = yup.InferType<typeof bankAccountSchema>;
