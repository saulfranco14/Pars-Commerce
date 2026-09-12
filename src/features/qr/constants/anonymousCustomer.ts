// Sentinel e-mail for anonymous QR payments. Write and read live together so a
// rename can't leave receipts showing the fake address.
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
