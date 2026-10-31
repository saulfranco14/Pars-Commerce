import { DENUE_MUNICIPIOS, DENUE_PAGE, GIRO_SCIAN } from "@/features/growth/constants/denue";
import { GIRO_COPY } from "@/features/growth/constants/giroCopy";
import { denueToLead, parseLeadCsv } from "@/features/growth/helpers/importRows";
import { denueCount, denueSearch, denueToken } from "@/features/growth/services/denueApiService";
import { internalError } from "@/features/growth/services/growthDb";
import { addLead } from "@/features/growth/services/leadService";
import { notifyOperators } from "@/features/growth/services/operatorService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { CsvImportInput, CsvImportResult, GrowthImport, ImportCursor, ImportInput, ImportPreview } from "@/features/growth/interfaces/importJob";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const IMPORT_COLUMNS = "id, source, status, municipios, giros, only_with_contact, assign_to, found, imported, updated, skipped, error, created_at, finished_at, cursors";
const NO_TOKEN = { ok: false, error: { code: "validation", message: "Falta INEGI_DENUE_TOKEN en las variables de entorno. Pídelo gratis en la página del DENUE del INEGI." } } as const;

function validInput(input: ImportInput): string | null {
  if (!input.municipios?.length || input.municipios.some((code) => !DENUE_MUNICIPIOS.some((m) => m.code === code))) return "Elige al menos un municipio de la lista.";
  if (!input.giros?.length || input.giros.some((giro) => !GIRO_SCIAN[giro])) return "Elige al menos un giro.";
  return null;
}

const municipioName = (code: string) => DENUE_MUNICIPIOS.find((m) => m.code === code)?.name ?? code;
const giroOfClase = (clase: string) => Object.entries(GIRO_SCIAN).find(([, clases]) => clases.includes(clase))?.[0] ?? null;

/** How many businesses the DENUE has for that choice, and how many of those zones are already in the list. */
export async function previewImport(db: GrowthDb, actor: GrowthActor, input: ImportInput): Promise<ServiceResult<ImportPreview>> {
  const invalid = validInput(input);
  if (invalid) return { ok: false, error: { code: "validation", message: invalid } };
  const token = denueToken();
  if (!token) return NO_TOKEN;

  try {
    const counts = await denueCount(token, input.giros.flatMap((giro) => GIRO_SCIAN[giro]), input.municipios);
    const byGiro = new Map<string, number>();
    const byMunicipio = new Map<string, number>();
    for (const row of counts) {
      const giro = giroOfClase(row.clase);
      if (!giro) continue;
      byGiro.set(giro, (byGiro.get(giro) ?? 0) + row.total);
      byMunicipio.set(municipioName(row.area), (byMunicipio.get(municipioName(row.area)) ?? 0) + row.total);
    }
    const { count } = await db
      .from("growth_leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", actor.workspaceId)
      .in("municipio", input.municipios.map(municipioName))
      .in("giro", input.giros);
    return {
      ok: true,
      data: {
        total: [...byGiro.values()].reduce((sum, value) => sum + value, 0),
        byGiro: [...byGiro].map(([giro, total]) => ({ giro, total })).sort((a, b) => b.total - a.total),
        byMunicipio: [...byMunicipio].map(([municipio, total]) => ({ municipio, total })).sort((a, b) => b.total - a.total),
        alreadyInBase: count ?? 0,
      },
    };
  } catch (error) {
    return { ok: false, error: { code: "internal", message: `No pudimos consultar el DENUE: ${error instanceof Error ? error.message : "sin detalle"}` } };
  }
}

export async function createImport(db: GrowthDb, actor: GrowthActor, input: ImportInput): Promise<ServiceResult<GrowthImport>> {
  const invalid = validInput(input);
  if (invalid) return { ok: false, error: { code: "validation", message: invalid } };
  if (!denueToken()) return NO_TOKEN;
  const cursors: ImportCursor[] = input.municipios.flatMap((area) =>
    input.giros.flatMap((giro) => GIRO_SCIAN[giro].map((clase) => ({ area, clase, giro, municipio: municipioName(area), next: 1, done: false }))),
  );
  const { data, error } = await db
    .from("growth_imports")
    .insert({
      workspace_id: actor.workspaceId,
      created_by: actor.userId,
      source: "denue",
      municipios: input.municipios,
      giros: input.giros,
      only_with_contact: input.onlyWithContact,
      assign_to: input.assignTo,
      cursors,
    })
    .select(IMPORT_COLUMNS)
    .single();
  if (error) return internalError(error.message);
  return { ok: true, data: data as GrowthImport };
}

export async function listImports(db: GrowthDb, actor: GrowthActor): Promise<ServiceResult<GrowthImport[]>> {
  const { data, error } = await db.from("growth_imports").select(IMPORT_COLUMNS).eq("workspace_id", actor.workspaceId).order("created_at", { ascending: false }).limit(20);
  if (error) return internalError(error.message);
  return { ok: true, data: (data ?? []) as GrowthImport[] };
}

/** Imported leads nobody owns yet go to the chosen person; leads already worked keep their owner. */
async function assignImported(db: GrowthDb, job: GrowthImport & { workspace_id: string; created_by: string | null }, denueIds: string[]) {
  if (!job.assign_to || !job.created_by || !denueIds.length) return;
  const { data } = await db.from("growth_leads").select("id").eq("workspace_id", job.workspace_id).in("denue_id", denueIds).is("owner_user_id", null);
  const ids = ((data ?? []) as Array<{ id: string }>).map((row) => row.id);
  if (ids.length) await db.rpc("growth_assign_leads", { p_workspace_id: job.workspace_id, p_actor_id: job.created_by, p_lead_ids: ids, p_owner_id: job.assign_to });
}

/**
 * Advances one import for up to `budgetMs`: one DENUE page per municipio and class at a time, saved after each
 * page so the next request or cron tick picks up where it stopped.
 */
export async function runImportStep(db: GrowthDb, importId: string, budgetMs = 40_000): Promise<void> {
  const { data: claimed } = await db.rpc("growth_claim_import", { p_import_id: importId, p_seconds: Math.ceil(budgetMs / 1000) + 30 });
  const job = claimed as (GrowthImport & { workspace_id: string; created_by: string | null }) | null;
  if (!job?.id) return;
  const token = denueToken();
  const started = Date.now();
  const totals = { found: job.found, imported: job.imported, updated: job.updated, skipped: job.skipped };
  const cursors = job.cursors;

  try {
    if (!token) throw new Error("Falta INEGI_DENUE_TOKEN");
    for (const cursor of cursors) {
      while (!cursor.done && Date.now() - started < budgetMs) {
        const records = await denueSearch(token, { area: cursor.area, clase: cursor.clase, from: cursor.next, to: cursor.next + DENUE_PAGE - 1 });
        const leads = records.map((record) => denueToLead(record, cursor)).filter((lead) => lead !== null);
        const keep = job.only_with_contact ? leads.filter((lead) => lead.phone_e164 || lead.email) : leads;
        totals.found += records.length;
        totals.skipped += records.length - keep.length;
        if (keep.length) {
          const { data, error } = await db.rpc("growth_upsert_leads", { p_rows: keep, p_workspace_id: job.workspace_id });
          if (error) throw new Error(error.message);
          const result = (Array.isArray(data) ? data[0] : data) as { inserted: number; updated: number };
          totals.imported += result.inserted;
          totals.updated += result.updated;
          await assignImported(db, job, keep.map((lead) => lead.denue_id));
        }
        cursor.next += DENUE_PAGE;
        cursor.done = records.length < DENUE_PAGE;
        await db.from("growth_imports").update({ cursors, ...totals }).eq("id", job.id);
      }
      if (Date.now() - started >= budgetMs) break;
    }

    const finished = cursors.every((cursor) => cursor.done);
    await db.from("growth_imports").update({
      cursors,
      ...totals,
      status: finished ? "done" : "running",
      finished_at: finished ? new Date().toISOString() : null,
      locked_until: null,
    }).eq("id", job.id);
    if (finished) {
      const giros = job.giros.map((giro) => GIRO_COPY[giro]?.label ?? giro).join(", ");
      await notifyOperators(db, { text: `<b>Importación lista</b> · ${giros}\n${totals.imported.toLocaleString("es-MX")} negocios nuevos, ${totals.updated.toLocaleString("es-MX")} actualizados.` }, { workspaceId: job.workspace_id, ownerId: job.created_by });
    }
  } catch (error) {
    await db.from("growth_imports").update({
      cursors,
      ...totals,
      status: "failed",
      error: (error instanceof Error ? error.message : "sin detalle").slice(0, 300),
      locked_until: null,
    }).eq("id", job.id);
  }
}

/** Cron: keeps unfinished imports moving, oldest first, within the tick's time. */
export async function runPendingImports(db: GrowthDb, budgetMs = 30_000): Promise<number> {
  const { data } = await db.from("growth_imports").select("id").in("status", ["queued", "running"]).order("created_at").limit(3);
  const started = Date.now();
  let worked = 0;
  for (const row of (data ?? []) as Array<{ id: string }>) {
    const left = budgetMs - (Date.now() - started);
    if (left < 5_000) break;
    await runImportStep(db, row.id, left);
    worked++;
  }
  return worked;
}

/** A person's own list, row by row through «Nuevo prospecto» rules: no repeated phone or email, owner set. */
export async function importCsv(db: GrowthDb, actor: GrowthActor, input: CsvImportInput): Promise<ServiceResult<CsvImportResult>> {
  if (!input.csv?.trim()) return { ok: false, error: { code: "validation", message: "Sube un archivo CSV." } };
  if (input.csv.length > 2_000_000) return { ok: false, error: { code: "validation", message: "El archivo pasa de 2 MB. Pártelo en varios." } };
  const owner = input.assignTo ? { ...actor, userId: input.assignTo } : actor;
  const parsed = parseLeadCsv(input.csv);
  const result: CsvImportResult = { created: 0, conflicts: 0, suppressed: 0, invalid: parsed.problems.length, problems: parsed.problems.slice(0, 10) };

  for (const { row, input: lead } of parsed.rows) {
    const added = await addLead(db, owner, lead);
    if (!added.ok) {
      result.invalid++;
      if (result.problems.length < 10) result.problems.push({ row, reason: added.error.message });
    } else if (added.data.status === "created") result.created++;
    else if (added.data.status === "conflict") result.conflicts++;
    else result.suppressed++;
  }
  await db.from("growth_imports").insert({
    workspace_id: actor.workspaceId,
    created_by: actor.userId,
    source: "csv",
    status: "done",
    assign_to: input.assignTo,
    found: parsed.rows.length + parsed.problems.length,
    imported: result.created,
    skipped: result.conflicts + result.suppressed + result.invalid,
    finished_at: new Date().toISOString(),
  });
  return { ok: true, data: result };
}
