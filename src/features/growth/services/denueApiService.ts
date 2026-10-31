import type { DenueRecord } from "@/features/growth/interfaces/importJob";

const BASE = "https://www.inegi.org.mx/app/api/denue/v1/consulta";
const TIMEOUT_MS = 25_000;

/** The free INEGI token (https://www.inegi.org.mx/servicios/api_denue.html); without it imports stay off. */
export function denueToken(): string | null {
  return process.env.INEGI_DENUE_TOKEN?.trim() || null;
}

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(`${BASE}/${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!response.ok) throw new Error(`DENUE respondió ${response.status}`);
  const text = await response.text();
  // With no matches the API answers plain text instead of an empty list.
  if (!text.trim().startsWith("[")) return [];
  return JSON.parse(text);
}

/** How many establishments each SCIAN class has in each area (Cuantificar). */
export async function denueCount(token: string, clases: string[], areas: string[]): Promise<Array<{ clase: string; area: string; total: number }>> {
  const rows = (await getJson(`Cuantificar/${clases.join(",")}/${areas.join(",")}/0/${token}`)) as Array<Record<string, unknown>>;
  return rows.map((row) => ({ clase: String(row.AE ?? ""), area: String(row.AG ?? ""), total: Number(row.Total ?? 0) || 0 }));
}

/** One page of establishments of a SCIAN class in a municipio (BuscarAreaAct). */
export async function denueSearch(token: string, input: { area: string; clase: string; from: number; to: number }): Promise<DenueRecord[]> {
  const entidad = input.area.slice(0, 2);
  const municipio = input.area.slice(2);
  const path = `BuscarAreaAct/${entidad}/${municipio}/0/0/0/0/0/0/${input.clase}/0/${input.from}/${input.to}/0/${token}`;
  const rows = await getJson(path);
  return Array.isArray(rows) ? (rows as DenueRecord[]) : [];
}
