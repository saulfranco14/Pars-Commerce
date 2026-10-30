"use client";

import { useState } from "react";
import { Database, FileUp, MapPin, Store } from "lucide-react";

import { useGrowthTeam } from "@/features/growth/hooks/useGrowthTeam";
import { useImports } from "@/features/growth/hooks/useImports";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { Notification } from "@/components/ui/Notification";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

import { DENUE_MUNICIPIOS, GIRO_SCIAN } from "@/features/growth/constants/denue";
import { GIRO_COPY } from "@/features/growth/constants/giroCopy";

import type { StatusTone } from "@/components/admin/StatusBadge";
import type { ImportInput, ImportStatus } from "@/features/growth/interfaces/importJob";

type Source = "denue" | "csv";

const SOURCES = [
  { value: "denue", label: "Desde el DENUE" },
  { value: "csv", label: "Subir mi lista" },
];

const STATUS_META: Record<ImportStatus, { label: string; tone: StatusTone }> = {
  queued: { label: "En cola", tone: "neutral" },
  running: { label: "Importando", tone: "info" },
  done: { label: "Lista", tone: "success" },
  failed: { label: "Falló", tone: "danger" },
};

const chip = (on: boolean) =>
  `inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors ${on ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-foreground hover:border-accent/50"}`;
const selectClass = "input-form min-h-11 w-full rounded-xl border border-border bg-surface-raised px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Brings more businesses into the list: from the INEGI DENUE by municipio and giro, or from the team's own CSV. */
export function ImportView() {
  const imports = useImports();
  const { team } = useGrowthTeam();
  const [source, setSource] = useState<Source>("denue");
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [giros, setGiros] = useState<string[]>([]);
  const [onlyWithContact, setOnlyWithContact] = useState(true);
  const [assignTo, setAssignTo] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const input: ImportInput = { municipios, giros, onlyWithContact, assignTo: assignTo || null };
  const people = (team?.members ?? []).filter((member) => member.status !== "suspended");

  function change(next: () => void) {
    next();
    imports.clearPreview();
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    await imports.upload(await file.text(), assignTo || null);
  }

  return (
    <div className="grid gap-5">
      <FilterTabs tabs={SOURCES} activeValue={source} onTabChange={(value) => setSource(value as Source)} ariaLabel="De dónde" density="touch" />
      {imports.error ? <Notification tone="error" message={imports.error} /> : null}

      <label className="grid max-w-md gap-1.5 text-sm font-semibold text-foreground">
        Asignar a
        <select value={assignTo} onChange={(event) => setAssignTo(event.target.value)} className={selectClass}>
          <option value="">Nadie: entran a la zona de quien la tenga</option>
          {people.map((member) => <option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}
        </select>
      </label>

      {source === "denue" ? (
        <section className="grid gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <fieldset className="grid gap-2">
            <legend className="pb-1 text-sm font-semibold text-foreground">Municipios</legend>
            <div className="flex flex-wrap gap-2">
              {DENUE_MUNICIPIOS.map((municipio) => (
                <button key={municipio.code} type="button" aria-pressed={municipios.includes(municipio.code)} onClick={() => change(() => setMunicipios((list) => toggle(list, municipio.code)))} className={chip(municipios.includes(municipio.code))}>
                  <MapPin className="h-4 w-4" aria-hidden />{municipio.name}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="grid gap-2">
            <legend className="pb-1 text-sm font-semibold text-foreground">Giros</legend>
            <div className="flex flex-wrap gap-2">
              {Object.keys(GIRO_SCIAN).map((giro) => (
                <button key={giro} type="button" aria-pressed={giros.includes(giro)} onClick={() => change(() => setGiros((list) => toggle(list, giro)))} className={chip(giros.includes(giro))}>
                  <Store className="h-4 w-4" aria-hidden />{GIRO_COPY[giro]?.label ?? giro}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="inline-flex min-h-11 items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={onlyWithContact} onChange={(event) => setOnlyWithContact(event.target.checked)} className="h-4 w-4 accent-accent" />
            Solo negocios con teléfono o correo
          </label>

          {imports.preview ? (
            <div className="grid gap-2 rounded-xl bg-surface-raised p-3 text-sm">
              <p className="text-foreground"><b className="tabular-nums">{imports.preview.total.toLocaleString("es-MX")}</b> negocios en el DENUE · <b className="tabular-nums">{imports.preview.alreadyInBase.toLocaleString("es-MX")}</b> ya están en tu lista (no se duplican)</p>
              <p className="text-muted-foreground">{imports.preview.byGiro.map((row) => `${GIRO_COPY[row.giro]?.label ?? row.giro}: ${row.total.toLocaleString("es-MX")}`).join(" · ")}</p>
              {onlyWithContact ? <p className="text-xs text-muted-foreground">Cuántos traen teléfono o correo se sabe al importarlos.</p> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={imports.busy || !municipios.length || !giros.length} onClick={() => void imports.loadPreview(input)} className={adminActionButtonSecondary}>
              <Database className="h-4 w-4" aria-hidden />Ver cuántos hay
            </button>
            <button type="button" disabled={imports.busy || !imports.preview} onClick={() => void imports.start(input)} className={adminActionButtonPrimary}>
              {imports.busy ? "Un momento…" : "Importar"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">La importación sigue aunque cierres esta pantalla; al terminar te avisa por Telegram.</p>
        </section>
      ) : (
        <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">
            Un CSV con columnas <b>negocio</b>, <b>telefono</b> o <b>correo</b>, <b>giro</b> y <b>municipio</b> (opcionales: colonia, nota). Hasta 2,000 filas.
            Un teléfono o correo que ya esté en la lista no se agrega dos veces.
          </p>
          <label className={`${adminActionButtonSecondary} w-fit cursor-pointer`}>
            <FileUp className="h-4 w-4" aria-hidden />{fileName ?? "Elegir archivo CSV"}
            <input type="file" accept=".csv,text/csv" className="sr-only" disabled={imports.busy} onChange={(event) => void readFile(event.target.files?.[0])} />
          </label>
          {imports.busy ? <p className="text-sm text-muted-foreground">Agregando prospectos…</p> : null}
          {imports.csvResult ? (
            <Notification
              tone={imports.csvResult.created ? "success" : "warning"}
              title={`${imports.csvResult.created} prospectos agregados`}
              message={
                <span className="grid gap-1">
                  <span>{imports.csvResult.conflicts} ya los trabajaba alguien · {imports.csvResult.suppressed} dados de baja · {imports.csvResult.invalid} con datos incompletos.</span>
                  {imports.csvResult.problems.map((problem) => <span key={problem.row} className="text-xs">Fila {problem.row}: {problem.reason}</span>)}
                </span>
              }
            />
          ) : null}
        </section>
      )}

      <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="text-base font-bold text-foreground">Importaciones</h2>
        {imports.jobs.length ? (
          <ul className="grid gap-2 text-sm">
            {imports.jobs.map((job) => (
              <li key={job.id} className="grid gap-1 rounded-xl border border-border-soft p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {job.source === "csv" ? "Lista propia (CSV)" : job.giros.map((giro) => GIRO_COPY[giro]?.label ?? giro).join(", ")}
                  </span>
                  <StatusBadge tone={STATUS_META[job.status].tone} label={STATUS_META[job.status].label} compact />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(job.created_at).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {job.source === "denue" ? ` · ${job.municipios.map((code) => DENUE_MUNICIPIOS.find((m) => m.code === code)?.name ?? code).join(", ")}` : ""}
                  {` · ${job.imported.toLocaleString("es-MX")} nuevos, ${job.updated.toLocaleString("es-MX")} actualizados, ${job.skipped.toLocaleString("es-MX")} omitidos`}
                </span>
                {job.error ? <span className="text-xs text-red-600">{job.error}</span> : null}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">Todavía no hay importaciones.</p>}
      </section>
    </div>
  );
}
