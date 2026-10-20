import * as yup from "yup";

/** New password + confirmation. Shared by invite/recovery, first login and profile. */
export const setPasswordSchema = yup.object({
  newPassword: yup
    .string()
    .required("La contraseña es obligatoria")
    .min(6, "Mínimo 6 caracteres"),
  confirmPassword: yup
    .string()
    .required("Confirma tu contraseña")
    .oneOf([yup.ref("newPassword")], "Las contraseñas no coinciden"),
});

export type SetPasswordValues = yup.InferType<typeof setPasswordSchema>;
