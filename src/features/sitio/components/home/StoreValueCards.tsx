import { CARD_ICONS } from "@/features/sitio/constants/inicio";

import type { StoreValueCardsProps } from "@/features/sitio/interfaces/storeHome";

export function StoreValueCards({ cards }: StoreValueCardsProps) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-(--store-radius) bg-(--store-hairline) ring-1 ring-(--store-hairline) sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = CARD_ICONS[card.icon ?? "heart"] ?? CARD_ICONS.heart;
        return (
          <li key={`${card.title}-${index}`} className="bg-(--store-surface) p-5 sm:p-6">
            <Icon className="h-6 w-6 text-(--store-ink)" aria-hidden strokeWidth={1.75} />
            <h3 className="mt-4 text-[17px] font-semibold text-(--store-ink)">{card.title}</h3>
            {card.description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-(--store-ink-2)">{card.description}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
