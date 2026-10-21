import { OFFER_TEMPLATES } from "@/features/promociones/constants/offerTemplates";

import type { OfferTemplate } from "@/features/promociones/interfaces/offerTemplate";

/** Templates written for this business type first, then the ones every business can use. */
export function templatesFor(businessType: string | null | undefined): {
  forYou: OfferTemplate[];
  universal: OfferTemplate[];
} {
  const type = businessType ?? "";
  return {
    forYou: OFFER_TEMPLATES.filter((template) => template.verticals !== "all" && template.verticals.includes(type)),
    universal: OFFER_TEMPLATES.filter((template) => template.verticals === "all"),
  };
}

export function findTemplate(key: string | null | undefined): OfferTemplate | null {
  return OFFER_TEMPLATES.find((template) => template.key === key) ?? null;
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Items whose name matches a template keyword come first, the rest keep their order. */
export function rankSuggestedItems<T extends { name: string }>(
  items: T[],
  keywords: readonly string[] | undefined,
): { item: T; suggested: boolean }[] {
  const words = (keywords ?? []).map(normalize);
  const ranked = items.map((item, index) => ({
    item,
    index,
    suggested: words.length > 0 && words.some((word) => normalize(item.name).includes(word)),
  }));
  ranked.sort((left, right) => Number(right.suggested) - Number(left.suggested) || left.index - right.index);
  return ranked.map(({ item, suggested }) => ({ item, suggested }));
}
