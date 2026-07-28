/**
 * Correo centinela para pagos QR anónimos (propinas, cobros sin datos).
 *
 * Existe para que el código de abajo siga funcionando sin obligar al cliente a
 * dar su correo, y NUNCA se muestra: las pantallas de recibo lo comparan para
 * ocultarlo. Por eso escritura y lectura viven aquí juntas — estaban duplicadas
 * como literal en dos archivos y cambiar uno solo habría hecho que los recibos
 * mostraran un correo falso.
 */
export const ANONYMOUS_CUSTOMER_EMAIL = "anonimo@tlaco.mx";

/** Valor previo al rebrand. Las órdenes ya guardadas lo conservan. */
const LEGACY_ANONYMOUS_CUSTOMER_EMAIL = "anonimo@pars.com.mx";

/** `true` si el correo es un centinela y por lo tanto no debe mostrarse. */
export function isAnonymousCustomerEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized === ANONYMOUS_CUSTOMER_EMAIL ||
    normalized === LEGACY_ANONYMOUS_CUSTOMER_EMAIL
  );
}
