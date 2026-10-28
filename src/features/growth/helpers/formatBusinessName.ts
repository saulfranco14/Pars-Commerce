// Articles stay capitalized: "Taquería El Güero" is part of the name.
const CONNECTORS = new Set(["y", "e", "o", "u", "de", "del", "en", "con", "para", "por", "a", "al", "sin"]);

function titleCase(word: string): string {
  return word.toLocaleLowerCase("es-MX").replace(/(^|[-'])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toLocaleUpperCase("es-MX"));
}

/** DENUE writes names in caps ("ACABADOS CERAMICOS") or with every word capitalized ("Aluminio Y Vidrio"). */
export function formatBusinessName(raw: string): string {
  const words = raw.trim().split(/\s+/).filter(Boolean);
  const shouting = !/\p{Ll}/u.test(raw);
  return words
    .map((word, index) => {
      const lower = word.toLocaleLowerCase("es-MX");
      if (index > 0 && CONNECTORS.has(lower)) return lower;
      // Keep codes as written: "24HRS", "S.A.", "K-9".
      if (!shouting || /[\d.]/.test(word)) return word;
      return titleCase(word);
    })
    .join(" ");
}
