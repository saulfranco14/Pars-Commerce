import { FeedbackLink as Link } from "@/components/navigation/FeedbackLink";
import { ArrowRight, Check } from "lucide-react";
import { StudioHomeShowcase } from "@/features/studio/components/landing/StudioHomeShowcase";
import { StudioWordmark } from "@/features/studio/components/landing/StudioWordmark";
import styles from "@/features/studio/components/landing/studioMarketing.module.css";

export function LandingStudio() {
  return (
    <section
      id="tlaco-studio"
      className="scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16"
    >
      <div
        className={`${styles.spotlight} mx-auto grid max-w-6xl items-center gap-8 rounded-[2rem] p-6 sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-10 lg:p-12`}
      >
        <div className="relative z-10">
          <StudioWordmark inverse />
          <h2 className="mt-6 max-w-xl text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Lo que vendes.
            <br />
            <span className="text-blue-400">Como nunca se vio.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-8 text-slate-300">
            Tu catálogo también puede ser tu próxima campaña. Diseña anuncios de
            tus productos, promociones y combos con tu foto, tu precio y tu
            marca.
          </p>
          <p className="mt-5 flex items-center gap-2 text-sm text-slate-300">
            <Check className="h-4 w-4 shrink-0 text-blue-400" aria-hidden />
            Edición manual y descargas: 0 Tlacos.
          </p>
          <Link
            href="/studio"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Conoce Tlaco Studio
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <p className="mt-3 text-xs leading-6 text-slate-400">
            Membresía adicional por negocio.
          </p>
        </div>
        <StudioHomeShowcase />
      </div>
    </section>
  );
}
