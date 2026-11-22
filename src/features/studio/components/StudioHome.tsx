"use client";
import Link from "next/link";
import { ArrowRight, Coins, Plus, WandSparkles } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Notification } from "@/components/ui/Notification";
import { FAB } from "@/components/ui/FAB";
import {
  pageHeaderCta,
  pageHeaderCtaDesktop,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { STUDIO_SOURCES, STUDIO_TEMPLATES } from "../constants/studio";
import { useStudioContinuation } from "../hooks/useStudioContinuation";
import { useStudioContext } from "./StudioProvider";
import { StudioLoading } from "./StudioLoading";

export function StudioHome() {
  useStudioContinuation();
  const { tenantSlug, summary, isLoading, error } = useStudioContext();
  const base = `/dashboard/${tenantSlug}/studio`;
  if (isLoading) return <StudioLoading />;
  if (error || !summary)
    return (
      <Notification
        tone="error"
        message={error?.message ?? "No pudimos cargar Studio."}
      />
    );
  const canCreate =
    summary.enabled && summary.permissions.includes("studio.create");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tlaco Studio"
        eyebrow="Del catálogo al anuncio"
        description="Tu producto, su precio y tu marca. Diseña una vez y prepara cada formato para compartirlo."
        action={
          canCreate ? (
            <Link className={pageHeaderCtaDesktop} href={`${base}/nuevo`}>
              <Plus className="h-4 w-4" />
              Crear diseño
            </Link>
          ) : undefined
        }
      />
      {summary.membership?.ai_blocked && (
        <Notification
          tone="warning"
          message="Hay un pago en revisión. Las generaciones están pausadas y tu contenido se conserva."
        />
      )}
      {!summary.enabled && (
        <Notification
          tone="info"
          message="La creación está temporalmente no disponible. Puedes explorar Studio, consultar tu biblioteca y descargar los archivos guardados."
        />
      )}
      {!summary.active && canCreate && (
        <section className="rounded-2xl border border-accent/20 bg-accent/5 p-5 sm:p-7">
          <div className="max-w-2xl">
            <WandSparkles className="h-7 w-7 text-accent" />
            <h2 className="mt-3 text-xl font-bold">
              Diseña gratis. Tu primer anuncio también se descarga gratis.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {summary.freeExportDesignId
                ? "Ya usaste tu descarga gratis. Puedes seguir creando y editando sin límite; para descargar o compartir más anuncios activa tu membresía."
                : "Elige un producto o promoción, ajusta foto y precio, y descarga tu primer anuncio sin costo. Además tienes Tlacos de regalo para probar la IA cuando actives tu membresía."}
            </p>
            <Link className={`${pageHeaderCta} mt-4`} href={`${base}/nuevo`}>
              <ArrowRight className="h-4 w-4" />
              Crear mi primer diseño
            </Link>
          </div>
        </section>
      )}
      <section
        aria-label="Resumen de Studio"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          { label: "Diseños creados", value: summary.counts.designs },
          { label: "Listos", value: summary.counts.ready },
          { label: "Colocaciones guardadas", value: summary.counts.placements },
          { label: "Tlacos disponibles", value: summary.balance.available },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{item.value}</p>
          </div>
        ))}
      </section>
      <section>
        <h2 className="text-lg font-bold">¿Qué quieres anunciar?</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STUDIO_SOURCES.map((source) =>
            canCreate ? (
              <Link
                key={source.value}
                href={`${base}/nuevo?source=${source.value}`}
                className="rounded-2xl border border-border bg-surface p-4 hover:border-accent"
              >
                <p className="font-bold">{source.label}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {source.description}
                </p>
                <ArrowRight className="mt-3 h-4 w-4 text-accent" />
              </Link>
            ) : (
              <div
                key={source.value}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <p className="font-bold">{source.label}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {source.description}
                </p>
              </div>
            ),
          )}
        </div>
      </section>
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Retoma tu trabajo</h2>
          <Link
            href={`${base}/disenos`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent"
          >
            Ver biblioteca
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {summary.recent.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.recent.map((design) => (
              <Link
                key={design.id}
                href={`${base}/disenos/${design.id}`}
                className="rounded-2xl border border-border bg-surface p-4"
              >
                <p className="font-bold">{design.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {design.status === "ready"
                    ? "Listo para compartir"
                    : "Borrador guardado"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={WandSparkles}
            title="Tu primer diseño empieza con lo que ya vendes"
            description="También puedes preparar una campaña libre con una fotografía propia."
          />
        )}
      </section>
      <section>
        <h2 className="text-lg font-bold">Plantillas para empezar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ejemplos de estilo. Aplicar una plantilla y ajustar tus capas consume
          0 Tlacos.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STUDIO_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="overflow-hidden rounded-2xl border border-border"
            >
              <div
                className="flex aspect-[4/3] flex-col justify-between p-4"
                style={{ background: template.background, color: template.ink }}
              >
                <span className="text-[10px] font-bold uppercase">
                  Ejemplo · Tu marca
                </span>
                <p className="text-xl font-bold">
                  Tu producto,
                  <br />
                  bien presentado.
                </p>
                <span
                  className="text-sm font-bold"
                  style={{ color: template.accent }}
                >
                  {template.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Link
        href={`${base}/tlacos`}
        className={`${adminActionButtonSecondary} w-full sm:w-auto`}
      >
        <Coins className="h-4 w-4" />
        {summary.active
          ? "Administrar membresía y Tlacos"
          : "Ver membresías y Tlacos"}
      </Link>
      {canCreate && (
        <FAB href={`${base}/nuevo`} aria-label="Crear diseño">
          <Plus className="h-6 w-6" />
        </FAB>
      )}
    </div>
  );
}
