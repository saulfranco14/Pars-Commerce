import Image from "next/image";
import { ArrowDownToLine, Check, MousePointer2, Send } from "lucide-react";
import type { StudioExample } from "../../constants/marketing";
import { StudioExamplePoster } from "./StudioExamplePoster";
import styles from "./studioMarketing.module.css";

const GUIDE = [
  ["Elige la foto de tu negocio", "Lleva tu contenido al diseño"],
  ["Dale protagonismo a tu mensaje", "Destaca el precio sin cambiar su valor"],
  ["Adapta una idea a varios formatos", "Descarga y comparte desde tu app"],
] as const;

export function StudioWalkthroughScene({
  example,
  step,
  format = "portrait",
  priority = false,
  playing = false,
  reducedMotion = false,
}: {
  example: StudioExample;
  step: number;
  format?: "portrait" | "square" | "story";
  priority?: boolean;
  playing?: boolean;
  reducedMotion?: boolean;
}) {
  return (
    <div
      key={`${example.id}-${step}-${format}`}
      className={styles.guidedScene}
      data-step={step}
      data-playing={playing}
      data-reduced-motion={reducedMotion}
    >
      <div className={styles.guidedStage}>
        {step === 0 ? (
          <div className={styles.sourceCard}>
            <div
              className={`${styles.sourcePhoto} relative aspect-[16/9] overflow-hidden rounded-lg`}
            >
              <Image
                src={example.image}
                alt={example.alt}
                fill
                priority={priority}
                sizes="260px"
                className="object-cover"
              />
              <span className={styles.sourceCheck}>
                <Check size={15} />
              </span>
            </div>
            <div className="px-1 pt-3">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">
                {example.category === "Campaña libre"
                  ? "Tu propio contenido"
                  : "Desde tu catálogo"}{" "}
                · {example.category}
              </p>
              <p className="mt-1 text-sm font-bold">{example.detail}</p>
              <p className="mt-1 text-xl font-bold tracking-tight">
                {example.price}
              </p>
            </div>
            <div className={`${styles.guidedAction} mt-3`} aria-hidden="true">
              Usar en mi diseño <span>→</span>
            </div>
          </div>
        ) : step === 1 ? (
          <div
            className={styles.designStage}
            style={{
              width: format === "story" ? 166 : format === "square" ? 270 : 235,
            }}
          >
            <StudioExamplePoster
              example={example}
              format={format}
              priority={priority}
              selected
              animate
            />
          </div>
        ) : (
          <div className={styles.shareStage}>
            <div className="grid grid-cols-[1.1fr_.68fr] items-center gap-4 px-2">
              <figure className={styles.shareSquare}>
                <div className={styles.showcasePoster}>
                  <StudioExamplePoster example={example} format="square" />
                </div>
                <figcaption className="mt-2 text-center text-[10px] font-semibold text-slate-600">
                  Publicación
                </figcaption>
              </figure>
              <figure className={styles.shareStory}>
                <div className={styles.showcasePoster}>
                  <StudioExamplePoster example={example} format="story" />
                </div>
                <figcaption className="mt-2 text-center text-[10px] font-semibold text-slate-600">
                  Historia
                </figcaption>
              </figure>
            </div>
            <div className={`${styles.guidedAction} mt-5`} aria-hidden="true">
              <span className="flex items-center gap-2">
                <ArrowDownToLine size={14} /> Descargar PNG
              </span>
              <Send size={14} />
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-600">
              Tu diseño guardado. Listo para volver a usarlo.
            </p>
          </div>
        )}
        <div className={styles.guideCursor} aria-hidden="true">
          <span className={styles.clickRing} />
          <MousePointer2
            className={styles.cursorArrow}
            size={30}
            fill="white"
            stroke="#172554"
            strokeWidth={1.5}
          />
          <span className={styles.cursorLabel}>Tú</span>
        </div>
      </div>
      <div className={styles.guideCaption} aria-hidden="true">
        <span className={styles.guideFirst}>{GUIDE[step][0]}</span>
        <span className={styles.guideSecond}>{GUIDE[step][1]}</span>
      </div>
    </div>
  );
}
