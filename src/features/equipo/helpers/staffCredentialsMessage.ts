import type { StaffCredentials } from "@/types/team";

/** The text the owner sends by WhatsApp so the person can log in. */
export function staffCredentialsMessage(
  credentials: StaffCredentials,
  name: string,
  loginUrl: string,
): string {
  return [
    `Hola ${name}, ya tienes acceso al equipo en Tlaco.`,
    `Entra en ${loginUrl}`,
    `${credentials.login.includes("@") ? "Email" : "Usuario"}: ${credentials.login}`,
    `Contraseña: ${credentials.password}`,
  ].join("\n");
}
