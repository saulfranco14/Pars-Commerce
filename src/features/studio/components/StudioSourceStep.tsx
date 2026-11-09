"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormInput } from "@/components/ui/FormInput";
import { Notification } from "@/components/ui/Notification";
import { EmptyState } from "@/components/admin/EmptyState";
import { Package } from "lucide-react";
import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { STUDIO_SOURCES } from "../constants/studio";
import { useStudioContext } from "./StudioProvider";
import { useStudioSource } from "../hooks/useStudioSource";
import { StudioOptions } from "./StudioOptions";
import { StudioMembershipSheet } from "./StudioMembershipSheet";
import { StudioWizardProgress } from "./StudioWizardProgress";
import { Skeleton } from "@/components/ui/Skeleton";
import { StudioLoading } from "./StudioLoading";
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
    [search, setSearch] = useState(""),
    [membershipOpen, setMembershipOpen] = useState(false);
  if (isLoading) return <StudioLoading />;
  if (!summary?.permissions.includes("studio.create"))
    return (
      <Notification
        tone="info"
        message="Necesitas permiso para crear diseños. El propietario puede dártelo desde Equipo."
      />
    );
  if (!summary.active || !summary.enabled)
    return (
      <div className="space-y-5">
        <PageHeader
          title="Prepara tu primer anuncio"
          description="Crear un diseño propio requiere una membresía Studio vigente."
        />
        <button
          className={adminActionButtonPrimary}
          onClick={() => setMembershipOpen(true)}
        >
          <ArrowRight className="h-4 w-4" />
          Ver membresías Studio
        </button>
        <StudioMembershipSheet
          open={membershipOpen}
          onClose={() => setMembershipOpen(false)}
        />
      </div>
    );
  return (
    <div className="space-y-5">
      <PageHeader
        title="¿Qué vas a anunciar?"
        description="Usaremos los datos reales de tu catálogo. Después podrás ajustar la composición sin gastar Tlacos."
      />
      <StudioWizardProgress step={1} />
      <StudioOptions
        label="Origen del anuncio"
        value={source.source}
        options={STUDIO_SOURCES.map((s) => ({
          value: s.value,
          label: s.label,
        }))}
        onChange={source.setSource}
        disabled={source.form.submitting}
      />
      {source.source !== "custom" && (
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormInput
                label="Buscar en tu catálogo"
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className={adminActionButtonSecondary}
              onClick={() => source.setQuery(search)}
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>
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
                  aria-pressed={source.sourceId === item.id}
                  disabled={source.form.submitting}
                  onClick={() => {
                    source.setSourceId(item.id);
                    source.form.setValue("title", item.name, {
                      shouldValidate: true,
                    });
                  }}
                  className={`flex min-h-14 items-center justify-between rounded-xl border p-3 text-left text-sm ${source.sourceId === item.id ? "border-accent bg-accent/5" : "border-border"}`}
                >
                  <span>{item.name}</span>
                  {source.sourceId === item.id && (
                    <Check className="h-4 w-4 text-accent" />
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
              className={adminActionButtonSecondary}
              onClick={source.next}
            >
              <ArrowRight className="h-4 w-4" />
              Más opciones
            </button>
          )}
        </section>
      )}
      <form
        onSubmit={source.form.handleSubmit(source.form.submit)}
        className="space-y-5"
      >
        <FormInput
          label="Nombre de este diseño"
          disabled={source.form.submitting}
          {...source.form.register("title")}
          error={source.form.errors.title?.message}
        />
        {source.form.submitError && (
          <Notification tone="error" message={source.form.submitError} />
        )}
        <div className="sticky bottom-0 z-20 flex justify-between gap-3 border-t border-border bg-surface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            href={`/dashboard/${tenantSlug}/studio`}
            className={adminActionButtonSecondary}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <button
            disabled={
              source.form.submitting ||
              (source.source !== "custom" && !source.sourceId)
            }
            className={adminActionButtonPrimary}
          >
            <ArrowRight className="h-4 w-4" />
            {source.form.submitting ? "Creando borrador…" : "Diseñar"}
          </button>
        </div>
      </form>
    </div>
  );
}
