"use client";
import { Download, MousePointer2, Type } from "lucide-react";
import { STUDIO_EXAMPLES } from "../../constants/marketing";
import { useStudioShowcase } from "../../hooks/useStudioShowcase";
import { StudioExamplePoster } from "./StudioExamplePoster";
import styles from "./studioMarketing.module.css";

const SLOTS = [
  { offset: 1, layout: "editorial", className: styles.stageBackLeft },
  { offset: 2, layout: "framed", className: styles.stageBackRight },
  { offset: 0, layout: "classic", className: styles.stageFront },
] as const;

export function StudioHeroStage() {
  const show = useStudioShowcase(STUDIO_EXAMPLES.length, 1, 4200);
  return (
    <div
      ref={show.container}
      {...show.interaction}
      className={styles.stage}
      data-playing={show.running}
      role="img"
      aria-label="Anuncios de ejemplo hechos con Tlaco Studio"
    >
      <div className={styles.stageGlow} />
      {SLOTS.map(({ offset, layout, className }) => {
        const example =
          STUDIO_EXAMPLES[(show.index + offset) % STUDIO_EXAMPLES.length];
        return (
          <div key={offset} className={`${styles.stageCard} ${className}`}>
            <div key={example.id} className={styles.stageSwap}>
              <StudioExamplePoster
                example={example}
                layout={layout}
                selected={offset === 0}
                priority={show.index === 0}
              />
            </div>
          </div>
        );
      })}
      <span className={`${styles.stageChip} ${styles.stageChipTitle}`}>
        <Type className="h-3.5 w-3.5 text-blue-600" aria-hidden />
        Tu texto
      </span>
      <span className={`${styles.stageChip} ${styles.stageChipExport}`}>
        <Download className="h-3.5 w-3.5 text-blue-600" aria-hidden />
        Listo para compartir
      </span>
      <span className={styles.stageCursor}>
        <MousePointer2
          size={28}
          fill="white"
          stroke="#172554"
          strokeWidth={1.5}
        />
        <span className={styles.cursorLabel}>Tu precio</span>
      </span>
    </div>
  );
}
