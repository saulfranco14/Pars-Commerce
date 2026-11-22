import { HeroExperience } from "@/features/landing/components/hero/HeroExperience";

import styles from "@/features/landing/components/hero/heroStage.module.css";

import type { HeroSceneSelection } from "@/features/landing/interfaces/heroScene";

/**
 * Campaign traffic decides in seconds, so the hero shows the promise working
 * (order → payment → owner's panel) instead of asking to be tapped. The
 * interactive demo lives right below, in `LandingTryIt`.
 */
export function LandingHero({
  scene,
  registerHref,
}: {
  scene: HeroSceneSelection;
  registerHref: string;
}) {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <div className={`${styles.grid} absolute inset-0`} aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-12">
        <HeroExperience initial={scene} registerHref={registerHref} />
      </div>
    </section>
  );
}
