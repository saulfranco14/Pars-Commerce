import type { RefObject } from "react";

export interface HeroSceneItem {
  name: string;
  price: number;
}

/** One business type shown in the home hero: the customer's order and where it was placed. */
export interface HeroScene {
  /** Matches a `/soluciones/{key}` path so campaigns can reuse the same slug. */
  key: string;
  word: string;
  place: string;
  image: string;
  alt: string;
  items: HeroSceneItem[];
}

export interface HeroSceneSelection {
  index: number;
  fromCampaign: boolean;
}

export interface HeroStageProps {
  scene: HeroScene;
  replayKey: string;
  paused: boolean;
  reducedMotion: boolean;
  priority: boolean;
  onToggle: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

export interface HeroGiroLink {
  label: string;
  href: string;
  image: string;
}
