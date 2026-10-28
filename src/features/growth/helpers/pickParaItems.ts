import type { CatalogItemDefinition } from "@/features/catalog/catalogDefinitions";

/** One item per category in turns, so the preview shows the range of the store instead of six sodas. */
export function pickParaItems(items: CatalogItemDefinition[], limit: number): CatalogItemDefinition[] {
  const groups = new Map<string, CatalogItemDefinition[]>();
  for (const item of items) {
    const key = item.category ?? item.type;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  const queues = [...groups.values()];
  const picked: CatalogItemDefinition[] = [];
  for (let round = 0; picked.length < limit && queues.some((queue) => queue.length > round); round += 1) {
    for (const queue of queues) {
      if (picked.length >= limit) break;
      if (queue[round]) picked.push(queue[round]);
    }
  }
  return picked;
}
