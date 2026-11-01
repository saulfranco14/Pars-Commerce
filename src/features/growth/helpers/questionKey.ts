// Words that do not change what is being asked; «tlaco» is implied in every question.
const STOPWORDS = new Set([
  "a", "al", "algo", "como", "con", "cual", "cuales", "de", "del", "donde", "el", "en", "es", "esta", "este", "eso", "esto",
  "hay", "la", "las", "le", "les", "lo", "los", "me", "mi", "mis", "o", "para", "pero", "por", "que", "quien", "se", "si",
  "sin", "son", "su", "sus", "te", "tiene", "tienen", "tlaco", "tu", "tus", "un", "una", "uno", "unos", "unas", "usted", "y", "ya",
]);

/** Crude Spanish stem: «cobran», «cobra» and «cobrar» land together, same for plurals. */
function stem(word: string): string {
  if (word.length <= 4) return word;
  const root = word.replace(/(ciones|siones|cion|sion|mente|ando|iendo|aron|ieron|ar|er|ir|es|as|os|an|en|n|s)$/, "").replace(/[aeio]$/, "");
  return root.length >= 3 ? root : word;
}

/** Same key for the same doubt written differently: no accents, no filler words, word order ignored. */
export function questionKey(question: string): string {
  const words = question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !STOPWORDS.has(word))
    .map(stem);
  return [...new Set(words)].sort().join(" ");
}
