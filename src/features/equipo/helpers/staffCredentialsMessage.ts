import type { StaffCredentials } from "@/types/team";

/** The text the owner sends by WhatsApp so the person can log in. */
export function staffCredentialsMessage(
  credentials: StaffCredentials,
  login: { name: string; email: string; loginUrl: string },
): string {
  const identifier = credentials.username ?? login.email;
  return [
    `Hola ${login.name}, ya tienes acceso al equipo en Tlaco.`,
    `Entra en ${login.loginUrl}`,
    `${credentials.username ? "Usuario" : "Email"}: ${identifier}`,
    `Contraseña temporal: ${credentials.tempPassword}`,
    "Al entrar te pedirá crear tu propia contraseña.",
  ].join("\n");
}
