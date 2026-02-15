const MEXICO_OFFSET = "-06:00";
const MEXICO_TZ = "America/Mexico_City";

export function getMexicoDateBounds(dateStr: string): {
  startUTC: string;
  endUTC: string;
} {
  const startLocal = new Date(`${dateStr}T00:00:00${MEXICO_OFFSET}`);
  const endLocal = new Date(`${dateStr}T23:59:59.999${MEXICO_OFFSET}`);
  return {
    startUTC: startLocal.toISOString(),
    endUTC: endLocal.toISOString(),
  };
}

export function toMexicoDateStr(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  return d.toLocaleDateString("en-CA", { timeZone: MEXICO_TZ });
}

export function getCurrentMonthBoundsMexico(): { from: string; to: string } {
  const now = new Date();
  const mxDateStr = now.toLocaleDateString("en-CA", { timeZone: MEXICO_TZ });
  const [year, month] = mxDateStr.split("-").map(Number);
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}
