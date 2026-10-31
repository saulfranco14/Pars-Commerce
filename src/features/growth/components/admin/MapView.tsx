"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";

import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { useProspectMap } from "@/features/growth/hooks/useProspectMap";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { MAP_NEUTRAL, MAP_SERIES, STAGE_MAP_GROUP } from "@/features/growth/constants/mapColors";
import { leadPath } from "@/features/growth/constants/routes";

import type { MapColorMode, MapLegendItem, MapPoint, MapViewProps } from "@/features/growth/interfaces/map";

const ProspectMap = dynamic(() => import("@/features/growth/components/admin/ProspectMap"), {
  ssr: false,
  loading: () => <LoadingBlock message="Cargando el mapa…" variant="skeleton" />,
});

const MODES = [
  { value: "estado", label: "Por estado" },
  { value: "persona", label: "Por persona" },
  { value: "telefono", label: "Con teléfono" },
];

function legend(points: MapPoint[], colorOf: (point: MapPoint) => string, labelOf: (point: MapPoint) => string): MapLegendItem[] {
  const groups = new Map<string, MapLegendItem>();
  for (const point of points) {
    const label = labelOf(point);
    const item = groups.get(label) ?? { label, color: colorOf(point), count: 0 };
    item.count += 1;
    groups.set(label, item);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count);
}

/** Where the team has worked, what is left, whose zone is whose, and today's visiting route. */
export function MapView({ giro, owner, people }: MapViewProps) {
  const { actor } = useGrowthMe();
  const map = useProspectMap({ giro, owner });
  const [mode, setMode] = useState<MapColorMode>("estado");
  const points = map.result?.points ?? [];
  const personColor = new Map(people.map((member, index) => [member.user_id, MAP_SERIES[index % MAP_SERIES.length]]));
  const personName = new Map(people.map((member) => [member.user_id, member.user_id === actor?.userId ? "Tú" : member.display_name]));

  const colorOf = (point: MapPoint) =>
    mode === "estado" ? STAGE_MAP_GROUP[point.stage].color
    : mode === "persona" ? (point.owner_user_id ? personColor.get(point.owner_user_id) ?? MAP_SERIES[0] : MAP_NEUTRAL)
    : point.has_phone ? MAP_SERIES[0] : MAP_NEUTRAL;
  const labelOf = (point: MapPoint) =>
    mode === "estado" ? STAGE_MAP_GROUP[point.stage].label
    : mode === "persona" ? (point.owner_user_id ? personName.get(point.owner_user_id) ?? "Otra persona" : "Sin asignar")
    : point.has_phone ? "Con teléfono" : "Sin teléfono";

  const touched = points.filter((point) => point.stage !== "nuevo" && point.stage !== "sin_contacto").length;
  const gaps = [...points.filter((point) => !point.owner_user_id && point.colonia).reduce((acc, point) => {
    const key = `${point.colonia}|${point.municipio}`;
    acc.set(key, (acc.get(key) ?? 0) + 1);
    return acc;
  }, new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid min-w-0 gap-3">
        <FilterTabs tabs={MODES} activeValue={mode} onTabChange={(value) => setMode(value as MapColorMode)} ariaLabel="Colorear por" />
        <ProspectMap points={points} route={map.route} colorOf={colorOf} onBoundsChange={map.setBounds} />
        <p className="text-xs text-muted-foreground">
          {map.result ? `Mostrando ${points.length.toLocaleString("es-MX")} de ${map.result.total.toLocaleString("es-MX")} negocios en esta zona; acerca el mapa para ver todos.` : "Cargando negocios…"}
        </p>
      </div>

      <aside className="grid content-start gap-4">
        <section className="grid gap-2 rounded-2xl border border-border bg-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">En pantalla</p>
          <ul className="grid gap-1.5 text-sm">
            {legend(points, colorOf, labelOf).map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-foreground"><span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} aria-hidden />{item.label}</span>
                <b className="tabular-nums text-foreground">{item.count.toLocaleString("es-MX")}</b>
              </li>
            ))}
          </ul>
          {points.length ? <p className="text-xs text-muted-foreground">{touched.toLocaleString("es-MX")} ya tienen contacto ({Math.round((touched / points.length) * 100)} %).</p> : null}
        </section>

        <section className="grid gap-2 rounded-2xl border border-border bg-surface p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ruta de hoy</p>
          <p className="text-sm text-muted-foreground">Con tu ubicación, los 8 negocios más cercanos para visitar, en orden.</p>
          {map.routeState === "error" && map.routeError ? <Notification tone="error" message={map.routeError} /> : null}
          {map.route.length ? (
            <>
              <ol className="grid gap-1.5 text-sm">
                {map.route.map((stop, index) => (
                  <li key={stop.id} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">{index + 1}</span>
                    <Link href={leadPath(stop.id)} className="min-w-0 truncate font-semibold text-foreground hover:underline">{formatBusinessName(stop.business_name)}</Link>
                    <span className="ml-auto shrink-0 tabular-nums text-xs text-muted-foreground">{Math.round(stop.distance_m)} m</span>
                  </li>
                ))}
              </ol>
              <button type="button" onClick={map.clearRoute} className={adminActionButtonSecondary}>Quitar la ruta</button>
            </>
          ) : (
            <button type="button" disabled={map.routeState === "locating"} onClick={map.planRoute} className={adminActionButtonPrimary}>
              <LocateFixed className="h-4 w-4" aria-hidden />{map.routeState === "locating" ? "Buscando dónde estás…" : "Armar mi ruta"}
            </button>
          )}
        </section>

        {gaps.length ? (
          <section className="grid gap-2 rounded-2xl border border-border bg-surface p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Colonias sin dueño</p>
            <p className="text-xs text-muted-foreground">Donde hay más negocios que nadie trabaja todavía.</p>
            <ul className="grid gap-1 text-sm">
              {gaps.map(([key, count]) => {
                const [colonia, municipio] = key.split("|");
                return (
                  <li key={key} className="flex items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-foreground"><MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden /><span className="truncate">{formatBusinessName(colonia)}, {municipio}</span></span>
                    <b className="tabular-nums">{count}</b>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
