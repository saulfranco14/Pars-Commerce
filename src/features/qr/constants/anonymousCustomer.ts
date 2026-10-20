// Sentinel e-mail for anonymous QR payments. Write and read live together so a
// rename can't leave receipts showing the fake address.
export const ANONYMOUS_CUSTOMER_EMAIL = "anonimo@tlaco.app";

/**
 * Valores anteriores que las órdenes ya guardadas conservan. `tlaco.mx` no es
 * nuestro dominio: no debe volver a enviarse como correo del pagador.
 */
const LEGACY_ANONYMOUS_CUSTOMER_EMAILS = ["anonimo@tlaco.mx", "anonimo@pars.com.mx"];

/** `true` si el correo es un centinela y por lo tanto no debe mostrarse. */
export function isAnonymousCustomerEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized === ANONYMOUS_CUSTOMER_EMAIL ||
    LEGACY_ANONYMOUS_CUSTOMER_EMAILS.includes(normalized)
  );
}
