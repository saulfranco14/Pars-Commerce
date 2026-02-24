import * as yup from "yup";

export const registroSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required("El email es obligatorio")
    .email("Ingresa un email válido")
    .max(254, "Máximo 254 caracteres"),
  password: yup
    .string()
    .required("La contraseña es obligatoria")
    .min(6, "Mínimo 6 caracteres"),
});

export type RegistroFormValues = yup.InferType<typeof registroSchema>;
