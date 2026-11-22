import type { HeroScene } from "@/features/landing/interfaces/heroScene";

export function sceneTotal(scene: HeroScene): number {
  return scene.items.reduce((sum, item) => sum + item.price, 0);
}
