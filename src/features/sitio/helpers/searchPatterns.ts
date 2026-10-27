const COMBINING_MARKS = /\p{M}/gu;
const ACCENT_TOLERANT_MIN_LENGTH = 4;

/**
 * ilike patterns for a shopper's term: as typed, plus one where every vowel (and n, for ñ) is a
 * single-character wildcard, so "azucar" finds "Azúcar" and "penafiel" "Peñafiel". Short terms skip
 * the wildcard version because it would match almost anything.
 */
export function searchPatterns(term: string): string[] {
  const patterns = [`%${term}%`];
  const plain = term.normalize("NFD").replace(COMBINING_MARKS, "");
  if (plain.length >= ACCENT_TOLERANT_MIN_LENGTH) patterns.push(`%${plain.replace(/[aeioun]/gi, "_")}%`);
  return [...new Set(patterns)];
}
