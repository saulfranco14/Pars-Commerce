/** Normalizes a Mexican mobile/landline phone to E.164 without guessing. */
export function normalizeMexicanPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const localNumber =
    digits.length === 12 && digits.startsWith("52")
      ? digits.slice(2)
      : digits;

  if (!/^\d{10}$/.test(localNumber)) return null;
  return `+52${localNumber}`;
}

export function isValidMexicanPhone(value: string): boolean {
  return normalizeMexicanPhone(value) !== null;
}

/**
 * El teléfono siempre se captura como número local de 10 dígitos. Aceptamos
 * un pegado con +52, pero nunca conservamos letras ni una longitud ambigua.
 */
export function formatMexicanPhoneInput(value: string): string {
  const rawDigits = value.replace(/\D/g, "");
  const localDigits = rawDigits.startsWith("52") && rawDigits.length === 12
    ? rawDigits.slice(2)
    : rawDigits;

  if (localDigits.length <= 2) return localDigits;
  if (localDigits.length <= 6) {
    return `${localDigits.slice(0, 2)} ${localDigits.slice(2)}`;
  }
  return `${localDigits.slice(0, 2)} ${localDigits.slice(2, 6)} ${localDigits.slice(6)}`;
}
