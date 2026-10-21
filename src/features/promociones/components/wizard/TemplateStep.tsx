"use client";

import { PenLine } from "lucide-react";

import { OPTION_CARD } from "@/components/wizard/wizardStyles";
import { WizardStepHeading } from "@/components/wizard/WizardStepHeading";

import { OFFER_KIND_LABELS } from "@/features/promociones/constants/offerTemplates";
import { OFFER_WIZARD_TITLE_ID } from "@/features/promociones/constants/offerWizard";
import { templatesFor } from "@/features/promociones/helpers/templateSuggestions";

import type { OfferKind, OfferTemplate } from "@/features/promociones/interfaces/offerTemplate";

// Same shape as the solutions onboarding cards: full width, equal rows, clamped copy.
const TEMPLATE_GRID = "grid grid-cols-1 gap-3 sm:auto-rows-fr sm:grid-cols-2";
const TEMPLATE_CARD = "flex h-full min-h-28 w-full gap-4 bg-surface p-5";

function TemplateCard({ template, onPick }: { template: OfferTemplate; onPick: (key: string) => void }) {
  const Icon = template.icon;
  return (
    <button
      type="button"
      disabled={!template.available}
      onClick={() => onPick(template.key)}
      className={`${OPTION_CARD.base} ${OPTION_CARD.idle} ${TEMPLATE_CARD} items-start disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold text-foreground">{template.title}</span>
          {template.kind !== "promotion" ? (
            <span className="rounded-full bg-border-soft px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {OFFER_KIND_LABELS[template.kind]}
              {template.available ? "" : " · Pronto"}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 line-clamp-2 text-sm leading-5 text-muted-foreground">{template.description}</span>
        <span className="mt-1 line-clamp-1 text-xs font-medium text-foreground/70">Ej. {template.example}</span>
      </span>
    </button>
  );
}

export function TemplateStep({
  businessType,
  businessLabel,
  onPick,
  kinds,
  titleId = OFFER_WIZARD_TITLE_ID,
  eyebrow = "Nueva promoción",
}: {
  businessType: string | null;
  businessLabel: string | null;
  onPick: (key: string | null) => void;
  /** Only these kinds; every kind when omitted. */
  kinds?: readonly OfferKind[];
  titleId?: string;
  eyebrow?: string;
}) {
  const all = templatesFor(businessType);
  const keep = (template: OfferTemplate) => !kinds || kinds.includes(template.kind);
  const forYou = all.forYou.filter(keep);
  const universal = all.universal.filter(keep);

  return (
    <div className="space-y-8">
      <WizardStepHeading
        titleId={titleId}
        eyebrow={eyebrow}
        title="¿Qué quieres ofrecer?"
        subtitle="Elige un punto de partida; podrás ajustar todo en los siguientes pasos."
      />

      {forYou.length > 0 ? (
        <section aria-labelledby="templates-for-you">
          <h2 id="templates-for-you" className="mb-3 text-sm font-semibold text-muted-foreground">
            Para tu {businessLabel ?? "negocio"}
          </h2>
          <ul className={TEMPLATE_GRID}>
            {forYou.map((template) => (
              <li key={template.key}>
                <TemplateCard template={template} onPick={onPick} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="templates-universal">
        <h2 id="templates-universal" className="mb-3 text-sm font-semibold text-muted-foreground">
          Para cualquier negocio
        </h2>
        <ul className={TEMPLATE_GRID}>
          {universal.map((template) => (
            <li key={template.key}>
              <TemplateCard template={template} onPick={onPick} />
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => onPick(null)}
              className={`${OPTION_CARD.base} ${OPTION_CARD.idle} ${TEMPLATE_CARD} items-center border-dashed`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-border-soft text-muted-foreground">
                <PenLine className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-base font-semibold text-foreground">Empezar desde cero</span>
                <span className="block text-sm text-muted-foreground">Tú eliges cómo funciona.</span>
              </span>
            </button>
          </li>
        </ul>
      </section>
    </div>
  );
}
