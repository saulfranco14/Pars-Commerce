/**
 * Datos del responsable legal.
 *
 * ⚠️ PENDIENTES ANTES DE PUBLICAR: los valores marcados con `[...]` son
 * placeholders. La LFPDPPP exige que el Aviso de Privacidad identifique al
 * responsable con nombre y domicilio reales; publicar con los corchetes puestos
 * deja el aviso legalmente incompleto.
 *
 * Se centralizan aquí para que aparezcan una sola vez en los dos documentos.
 */
export const COMPANY = {
  brand: "Tlaco",
  legalName: "[RAZÓN SOCIAL PENDIENTE]",
  rfc: "[RFC PENDIENTE]",
  address: "[DOMICILIO FISCAL PENDIENTE]",
  privacyEmail: "[CORREO DE PRIVACIDAD PENDIENTE]",
  supportEmail: "[CORREO DE SOPORTE PENDIENTE]",
  domain: "[DOMINIO PENDIENTE]",
} as const;

/** Última revisión de los documentos legales. */
export const LEGAL_UPDATED_AT = "26 de julio de 2026";
