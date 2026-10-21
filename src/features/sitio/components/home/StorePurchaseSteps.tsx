import { StoreSectionHeader } from "@/features/sitio/components/StoreSectionHeader";

import type { StorePurchaseStepsProps } from "@/features/sitio/interfaces/storeHome";

export function StorePurchaseSteps({ steps, title = "Cómo comprar", subtitle = "Tres pasos y listo." }: StorePurchaseStepsProps) {
  return (
    <section aria-labelledby="store-steps-title">
      <StoreSectionHeader id="store-steps-title" title={title} subtitle={subtitle} />
      <ol className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {steps.map((step, index) => (
          <li
            key={`${step.title}-${index}`}
            className="flex gap-4 rounded-(--store-radius) bg-(--store-surface) p-4 ring-1 ring-(--store-hairline) sm:block sm:p-6"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--store-well) text-sm font-semibold tabular-nums text-(--store-ink)">
              {index + 1}
            </span>
            <div>
              <h3 className="text-[17px] font-semibold text-(--store-ink) sm:mt-4">{step.title}</h3>
              {step.description ? (
                <p className="mt-1 text-sm leading-relaxed text-(--store-ink-2) sm:mt-1.5">{step.description}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
