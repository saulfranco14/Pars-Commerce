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
