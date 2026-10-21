"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, CirclePause, Repeat, Sparkles, Users } from "lucide-react";

import { usePlansList } from "@/features/planes/hooks/usePlansList";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricsStrip } from "@/components/admin/MetricsStrip";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { Toast } from "@/components/ui/Toast";
import { PlanListCard } from "@/features/planes/components/PlanListCard";

import { templatesFor } from "@/features/promociones/helpers/templateSuggestions";

import type { OfferPlan } from "@/features/planes/interfaces/offerPlan";
import type { Tenant } from "@/types/database";

export function PlansPanel({ tenant, base, canWrite }: { tenant: Tenant; base: string; canWrite: boolean }) {
  const router = useRouter();
  const list = usePlansList(tenant.id);
  const [toArchive, setToArchive] = useState<OfferPlan | null>(null);
  const storeBase = tenant.public_store_enabled && tenant.site_slug ? `/sitio/${tenant.site_slug}/planes` : null;
  const all = templatesFor(tenant.business_type);
  const quickStarts = [...all.forYou, ...all.universal].filter((template) => template.kind === "subscription").slice(0, 3);

  return (
    <div className="space-y-5">
      {list.plans.length > 0 ? (
        <MetricsStrip
          metrics={[
            { label: "Activos", value: list.counts.active, tone: "emerald", icon: Repeat },
            { label: "Suscritos", value: list.subscribers, tone: "accent", icon: Users },
            { label: "Pausados", value: list.counts.paused, tone: list.counts.paused > 0 ? "amber" : "default", icon: CirclePause },
            { label: "Borradores", value: list.counts.draft, icon: Sparkles },
          ]}
        />
      ) : null}

      {list.loadError ? <Notification tone="error" message="No pudimos cargar tus suscripciones. Intenta de nuevo." /> : null}

      {list.isLoading ? (
        <LoadingBlock variant="skeleton" skeletonRows={3} />
      ) : list.plans.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Crea tu primera suscripción"
          description="Tus clientes pagan el primer periodo al comprar y tú generas el cobro de cada periodo sin perseguirlos."
          action={
            canWrite ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                {quickStarts.map((template) => (
                  <Link
                    key={template.key}
                    href={`${base}/planes/nueva?template=${template.key}`}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground hover:border-accent/40"
                  >
                    <template.icon className="h-4 w-4 text-accent" aria-hidden />
                    {template.title}
                  </Link>
                ))}
              </div>
            ) : null
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.plans.map((plan) => (
            <li key={plan.id}>
              <PlanListCard
                plan={plan}
                storeUrl={storeBase ? `${storeBase}/${plan.slug}` : null}
                busy={list.busyId === plan.id}
                onEdit={() => router.push(`${base}/planes/${plan.id}/editar`)}
                onPause={() => void list.pause(plan.id)}
                onActivate={() => void list.activate(plan.id)}
                onArchive={() => setToArchive(plan)}
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        isOpen={Boolean(toArchive)}
        onClose={() => setToArchive(null)}
        onConfirm={async () => {
          if (toArchive) await list.archive(toArchive.id);
          setToArchive(null);
        }}
        title="¿Archivar este plan?"
        description="Deja de venderse en tu tienda. Quienes ya están suscritos siguen con su plan hasta que lo cancelen."
        confirmLabel="Archivar"
        variant="danger"
        icon={Archive}
        loading={Boolean(toArchive && list.busyId === toArchive.id)}
      />

      {list.notice ? <Toast message={list.notice.message} tone={list.notice.tone} onDone={list.clearNotice} /> : null}
    </div>
  );
}
