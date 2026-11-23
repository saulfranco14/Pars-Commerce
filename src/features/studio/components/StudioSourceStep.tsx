"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Package, Search } from "lucide-react";
import { useStudioSource } from "../hooks/useStudioSource";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { Skeleton } from "@/components/ui/Skeleton";
import { useStudioContext } from "./StudioProvider";
import { StudioActionBar } from "./StudioActionBar";
import { StudioIdeas } from "./StudioIdeas";
import { StudioLoading } from "./StudioLoading";
import { StudioStepper } from "./StudioStepper";
import {
  actionPair,
  adminActionButtonIcon,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import {
  STUDIO_ACTION_BAR_SPACE,
  STUDIO_HOW_IT_WORKS,
  STUDIO_SOURCES,
} from "../constants/studio";
import type { StudioSourceType } from "../interfaces/studio";

export function StudioSourceStep({
  initialSource = "product",
  initialId = null,
  quick = false,
}: {
  initialSource?: StudioSourceType;
  initialId?: string | null;
  quick?: boolean;
}) {
  const { tenantSlug, summary, isLoading } = useStudioContext(),
    source = useStudioSource(initialSource, initialId, quick),
    [search, setSearch] = useState("");
  if (isLoading) return <StudioLoading />;
  if (!summary?.permissions.includes("studio.create"))
    return (
      <Notification
        tone="info"
        message="Necesitas permiso para crear diseños. El propietario puede dártelo desde Equipo."
      />
    );
  if (!summary.enabled)
    return (
      <Notification
        tone="info"
        message="La creación está temporalmente no disponible. Tu biblioteca y tus archivos guardados se conservan."
      />
    );
  return (
    <div className={`space-y-5 ${STUDIO_ACTION_BAR_SPACE}`}>
      <PageHeader
        title="¿Qué vas a anunciar?"
        description="Usamos los datos reales de tu catálogo. Tú solo eliges."
      />
      <StudioStepper step={1} />
      <ol className="grid grid-cols-3 gap-2">
        {STUDIO_HOW_IT_WORKS.map((item, i) => (
          <li
            key={item.title}
            className="rounded-xl bg-border-soft/60 p-3 text-xs leading-snug text-muted-foreground"
          >
            <span className="block text-sm font-bold text-foreground">
              {i + 1}. {item.title}
            </span>
            {item.detail}
          </li>
        ))}
      </ol>
      <StudioIdeas
        ideas={source.ideas}
        loading={source.ideasLoading}
        starting={source.startingIdea}
        disabled={source.busy}
        onStart={(idea) => void source.startIdea(idea)}
      />
      {source.ideaError && (
        <Notification tone="error" message={source.ideaError} />
      )}
      <section className="space-y-4 rounded-2xl border border-border bg-surface p-4">
        <div>
          <h2 className="text-sm font-bold">O elige tú</h2>
          <p className="text-xs text-muted-foreground">
            ¿No sabes cuál? Empieza por lo que más te piden: un anuncio con
            precio se entiende al instante.
          </p>
        </div>
        <div
          className="grid grid-cols-2 gap-2 lg:grid-cols-4"
          role="group"
          aria-label="Origen del anuncio"
        >
          {STUDIO_SOURCES.map(({ value, label, description, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={source.source === value}
              disabled={source.busy}
              onClick={() => source.setSource(value)}
              className={`flex cursor-pointer flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60 ${source.source === value ? "border-accent bg-accent/5" : "border-border bg-surface hover:bg-border-soft/50"}`}
            >
              <Icon className="h-5 w-5 text-accent" aria-hidden />
              <span className="text-sm font-bold">{label}</span>
              <span className="text-xs leading-snug text-muted-foreground">
                {description}
              </span>
            </button>
          ))}
        </div>
        {source.source !== "custom" && (
          <div className="space-y-3">
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                source.setQuery(search);
              }}
            >
              <div className="min-w-0 flex-1">
                <FormInput
                  label="Buscar en tu catálogo"
                  icon={Search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className={adminActionButtonIcon} aria-label="Buscar">
                <Search className="h-4 w-4" />
              </button>
            </form>
            {source.sourceError && (
              <Notification
                tone="error"
                message="No pudimos cargar las opciones. Revisa tu permiso sobre el catálogo."
              />
            )}
            {source.isLoading ? (
              <div
                className="grid gap-2 sm:grid-cols-2"
                aria-label="Buscando en tu catálogo"
              >
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </div>
            ) : source.items.length ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {source.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={source.sourceId === item.id}
                    disabled={source.busy}
                    onClick={() => {
                      source.setSourceId(item.id);
                      source.form.setValue("title", item.name, {
                        shouldValidate: true,
                      });
                    }}
                    className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm ${source.sourceId === item.id ? "border-accent bg-accent/5" : "border-border"}`}
                  >
                    <span className="min-w-0 truncate">{item.name}</span>
                    {source.sourceId === item.id && (
                      <Check className="h-4 w-4 shrink-0 text-accent" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="Todavía no hay resultados"
                description="Agrega contenido al catálogo o elige una campaña libre."
              />
            )}
            {source.sourceId &&
              !source.items.some((i) => i.id === source.sourceId) && (
                <p className="text-sm text-accent">
                  Se validará el elemento seleccionado desde el catálogo al
                  continuar.
                </p>
              )}
            {source.hasNext && (
              <button
                type="button"
                className={`${adminActionButtonSecondary} w-full sm:w-auto`}
                onClick={source.next}
              >
                <ArrowRight className="h-4 w-4" />
                Más
              </button>
            )}
          </div>
        )}
      </section>
      <form
        id="studio-source-form"
        onSubmit={source.form.handleSubmit(source.form.submit)}
        className="space-y-5"
      >
        <FormInput
          label="Nombre de este diseño"
          disabled={source.busy}
          {...source.form.register("title")}
          error={source.form.errors.title?.message}
        />
        {source.form.submitError && (
          <Notification tone="error" message={source.form.submitError} />
        )}
        <StudioActionBar>
          <div className={actionPair}>
            <Link
              href={`/dashboard/${tenantSlug}/studio`}
              className={adminActionButtonSecondary}
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Link>
            <button
              type="submit"
              form="studio-source-form"
              disabled={
                source.busy || (source.source !== "custom" && !source.sourceId)
              }
              className={adminActionButtonPrimary}
            >
              <ArrowRight className="h-4 w-4" />
              {source.form.submitting ? "Creando…" : "Diseñar"}
            </button>
          </div>
        </StudioActionBar>
      </form>
    </div>
  );
}
