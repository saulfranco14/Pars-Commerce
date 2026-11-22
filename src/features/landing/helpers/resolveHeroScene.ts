import { HERO_SCENE_ALIASES, HERO_SCENES } from "@/features/landing/constants/heroScenes";

import type { HeroSceneSelection } from "@/features/landing/interfaces/heroScene";

function sceneIndexFor(value: string | undefined): number {
  if (!value) return -1;
  const tokens = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/);
  for (const token of tokens) {
    const key = HERO_SCENE_ALIASES[token] ?? token;
    const index = HERO_SCENES.findIndex((scene) => scene.key === key);
    if (index >= 0) return index;
  }
  return -1;
}

/** Picks the hero scene a campaign asked for (`?giro=` first, then `utm_content`). */
export function resolveHeroScene(params: {
  giro?: string | string[];
  utm_content?: string | string[];
}): HeroSceneSelection {
  const first = (value?: string | string[]) => (Array.isArray(value) ? value[0] : value);
  const index = [first(params.giro), first(params.utm_content)]
    .map(sceneIndexFor)
    .find((i) => i >= 0);
  return index === undefined ? { index: 0, fromCampaign: false } : { index, fromCampaign: true };
}
