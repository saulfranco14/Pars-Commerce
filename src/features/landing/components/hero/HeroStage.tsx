import Image from "next/image";
import { Check, Pause, Play } from "lucide-react";

import { HeroCustomerScreen } from "@/features/landing/components/hero/HeroCustomerScreen";
import { HeroOwnerScreen } from "@/features/landing/components/hero/HeroOwnerScreen";

import { HERO_STEPS } from "@/features/landing/constants/heroScenes";
import { formatCurrency } from "@/features/qr/helpers/format";
import { sceneTotal } from "@/features/landing/helpers/sceneTotal";
import styles from "@/features/landing/components/hero/heroStage.module.css";

import type { HeroStageProps } from "@/features/landing/interfaces/heroScene";

/** Designed at 256×528; phones shrink to 176 px wide below `lg`. */
function PhoneFrame({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <div className={`absolute h-90.75 w-44 lg:h-132 lg:w-64 ${className}`}>
      <div className="h-132 w-64 origin-top-left scale-[0.6875] rounded-[2.25rem] bg-slate-900 p-2 shadow-2xl shadow-black/60 ring-1 ring-white/15 lg:scale-100">
        <div className="h-full overflow-hidden rounded-[1.75rem] text-left">{children}</div>
      </div>
    </div>
  );
}

export function HeroStage({
  scene,
  replayKey,
  paused,
  reducedMotion,
  priority,
  onToggle,
  containerRef,
}: HeroStageProps) {
  const total = formatCurrency(sceneTotal(scene));

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-5xl">
      <div
        className={`${styles.stage} relative h-110 lg:h-150`}
        data-paused={paused}
        role="img"
        aria-label={`Ejemplo: en un ${scene.word}, el cliente paga su pedido de ${total} desde su celular y el negocio lo ve en su panel al instante.`}
      >
        <div key={replayKey} className="absolute inset-0">
          <div
            className={`${styles.backdrop} absolute inset-x-0 bottom-0 top-8 overflow-hidden rounded-3xl border border-white/10 lg:bottom-6 lg:top-12`}
          >
            <Image
              src={scene.image}
              alt=""
              fill
              priority={priority}
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/55" />
          </div>

          <PhoneFrame className="left-0 top-0 z-20 -rotate-3 sm:left-[10%] lg:left-[6%] lg:top-2 lg:rotate-0">
            <HeroCustomerScreen scene={scene} />
          </PhoneFrame>

          <PhoneFrame className="right-0 top-10 z-10 rotate-3 sm:right-[10%] lg:right-[6%] lg:top-8 lg:rotate-0">
            <HeroOwnerScreen scene={scene} />
          </PhoneFrame>

          <div
            className={`${styles.toast} absolute inset-x-0 top-[60%] z-30 mx-auto flex w-fit items-center gap-3 rounded-2xl bg-white py-2.5 pl-2.5 pr-4 text-left text-slate-900 shadow-2xl shadow-black/50 lg:top-16`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Check className="h-5 w-5" strokeWidth={3} aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-bold">Pago recibido · {total}</span>
              <span className="block text-xs text-slate-500">{scene.place} · hace 1 segundo</span>
            </span>
          </div>

          <ol className="absolute inset-x-0 top-[42%] z-0 mx-auto hidden w-fit flex-col text-left text-white lg:flex">
            {HERO_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex flex-col items-center">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      i === HERO_STEPS.length - 1
                        ? "bg-accent text-white ring-4 ring-accent/30"
                        : "bg-white text-slate-900"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {i < HERO_STEPS.length - 1 && <span className="h-8 w-0.5 bg-white/30" />}
                </span>
                <span className="pt-1 text-sm font-semibold">
                  {step.title}
                  <span className="block text-xs font-normal text-slate-300">{step.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {!reducedMotion && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={paused ? "Reanudar animación" : "Pausar animación"}
          className="absolute bottom-2 left-2 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-slate-950/70 text-white/80 ring-1 ring-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white lg:bottom-8"
        >
          {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
        </button>
      )}
    </div>
  );
}
