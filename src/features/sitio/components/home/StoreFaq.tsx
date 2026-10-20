import { Plus } from "lucide-react";

import { StoreSectionHeader } from "@/features/sitio/components/StoreSectionHeader";

import type { StoreFaqProps } from "@/features/sitio/interfaces/storeHome";

export function StoreFaq({ items }: StoreFaqProps) {
  return (
    <section aria-labelledby="store-faq-title" className="mx-auto max-w-3xl">
      <StoreSectionHeader id="store-faq-title" title="Preguntas frecuentes" />
      <div className="divide-y divide-(--store-hairline) border-y border-(--store-hairline)">
        {items.map((item, index) => (
          <details key={`${item.question}-${index}`} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-medium text-(--store-ink) marker:content-none [&::-webkit-details-marker]:hidden">
              {item.question}
              <Plus
                className="h-5 w-5 shrink-0 text-(--store-ink-2) motion-safe:transition-transform group-open:rotate-45"
                aria-hidden
              />
            </summary>
            <p className="whitespace-pre-line pb-5 pr-10 text-[15px] leading-relaxed text-(--store-ink-2)">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
