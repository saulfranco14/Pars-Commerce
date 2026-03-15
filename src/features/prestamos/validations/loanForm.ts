import * as yup from "yup";

// ── Subschemas (Single Responsibility por sección del formulario) ──────────────

export const customerSelectionSchema = yup.object({
  customer_id: yup.string().trim().required("Selecciona o crea un cliente"),
});

export const newCustomerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("El nombre es obligatorio")
    .min(3, "Mínimo 3 caracteres")
    .max(120, "Máximo 30 caracteres")
    .matches(
      /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-'\.]+$/,
      "El nombre solo puede contener letras",
    ),
  phone: yup
    .string()
    .trim()
    .required("El teléfono es obligatorio")
    .min(7, "Mínimo 7 dígitos")
    .max(20, "Máximo 20 dígitos")
    .matches(/^[\d\s\-\+\(\)]+$/, "Solo números, espacios y símbolos + - ( )"),
  email: yup
    .string()
    .trim()
    .required("El email es obligatorio")
    .email("Email inválido")
    .max(254, "Máximo 254 caracteres"),
});

export const loanDetailsSchema = yup.object({
  concept: yup
    .string()
    .trim()
    .required("El concepto es obligatorio")
    .min(2, "Mínimo 2 caracteres")
    .max(200, "Máximo 200 caracteres"),
  // amount is derived from items total — still validated to ensure it's positive
  amount: yup
    .number()
    .typeError("El monto total no es válido")
    .required("Agrega al menos un producto")
    .positive("El monto debe ser mayor a 0")
    .max(999_999, "Monto demasiado alto"),
  due_date: yup
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  notes: yup
    .string()
    .trim()
    .optional()
    .max(500, "Máximo 500 caracteres")
    .transform((v) => (v === "" ? undefined : v)),
});

// ── Schema completo del formulario ────────────────────────────────────────────

export const loanFormSchema = customerSelectionSchema.concat(loanDetailsSchema);

export type LoanFormValues = yup.InferType<typeof loanFormSchema>;
export type NewCustomerValues = yup.InferType<typeof newCustomerSchema>;

// ── Schema para editar cliente desde órdenes (nombre y teléfono obligatorios) ──
export const orderCustomerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("El nombre es obligatorio")
    .min(3, "Mínimo 3 caracteres")
    .max(120, "Máximo 120 caracteres")
    .matches(
      /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s\-'\.]+$/,
      "El nombre solo puede contener letras",
    ),
  phone: yup
    .string()
    .trim()
    .required("El teléfono es obligatorio")
    .min(7, "Mínimo 7 dígitos")
    .max(20, "Máximo 20 dígitos")
    .matches(/^[\d\s\-\+\(\)]+$/, "Solo números, espacios y símbolos + - ( )"),
  email: yup
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .email("Email inválido")
    .max(254, "Máximo 254 caracteres"),
});

export type OrderCustomerValues = yup.InferType<typeof orderCustomerSchema>;
