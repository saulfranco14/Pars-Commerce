import Link from "next/link";
import {
  ArrowDown,
  Check,
  Download,
  ImagePlus,
  Layers3,
  MonitorSmartphone,
  Share2,
  Sparkles,
} from "lucide-react";
import { STUDIO_EXAMPLES } from "../../constants/marketing";
import { StudioEditorPreview } from "./StudioEditorPreview";
import { StudioEntryCta } from "./StudioEntryCta";
import { StudioExamplePoster } from "./StudioExamplePoster";
import { StudioExamplesGallery } from "./StudioExamplesGallery";
import { StudioWordmark } from "./StudioWordmark";
import styles from "./studioMarketing.module.css";

export function StudioLandingHero({
  startingPrice,
  preview = false,
}: {
  startingPrice: string | null;
  preview?: boolean;
}) {
  return (
    <section className={styles.hero}>
      <div className="mx-auto max-w-6xl px-5 pt-12 text-center sm:px-8 sm:pt-16">
        <p className="inline-flex items-center gap-2 text-sm font-semibold">
          <StudioWordmark />
          <span className="mx-1 text-border" aria-hidden>
            /
          </span>
          <span className="font-normal text-muted-foreground">
            Tu espacio para crear
          </span>
        </p>
        <h1 className={`${styles.heroTitle} mx-auto mt-6 max-w-5xl font-bold`}>
          Crea anuncios para
          <br className="hidden sm:block" /> <span>tu negocio.</span>
          <span className="sr-only"> con Tlaco Studio</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          Lo que vendes merece verse así. Transforma tu catálogo en anuncios con
          tu foto, tu precio y toda tu personalidad.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <StudioEntryCta location="hero" />
          <Link
            href="#ejemplos"
            className="inline-flex min-h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold hover:bg-border-soft focus-visible:ring-2 focus-visible:ring-accent"
          >
            Explorar ideas
            <ArrowDown className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          {startingPrice
            ? `${preview ? "Precio de lanzamiento previsto: " : "Requiere Studio desde "}${startingPrice} MXN al mes · IVA incluido`
            : "Crear diseños requiere una membresía Studio por negocio."}
        </p>
      </div>
      <StudioEditorPreview />
      <div className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-5xl gap-3 px-5 py-6 text-sm sm:grid-cols-3 sm:gap-6 sm:px-8">
          {[
            { Icon: Layers3, text: "Tu foto y texto, en capas" },
            { Icon: Download, text: "Edición y exportación: 0 Tlacos" },
            { Icon: MonitorSmartphone, text: "Desde tu navegador" },
          ].map(({ Icon, text }) => (
            <p key={text} className="flex items-center justify-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              {text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StudioExamples() {
  return (
    <section
      id="ejemplos"
      className="scroll-mt-20 overflow-hidden py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">
              De tu negocio al mundo
            </p>
            <h2 className="mt-4 max-w-2xl text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              Ideas que se ven.
              <br />
              Ofertas que se entienden.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-7 text-muted-foreground">
            Un lanzamiento, el combo del día o esa promoción de fin de semana.
            Dale a cada idea su propio espacio.
          </p>
        </div>
        <StudioExamplesGallery />
      </div>
    </section>
  );
}

export function StudioHowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 border-y border-border bg-surface py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">
            Menos empezar de cero
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Ya tienes qué vender.
            <br />
            Ahora dale forma.
          </h2>
        </div>
        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {[
            {
              title: "Trae tu catálogo.",
              detail:
                "Elige un producto, promoción, combo o plan de Tlaco. Su foto, precio y condiciones son tu punto de partida.",
              Icon: ImagePlus,
            },
            {
              title: "Hazlo tuyo.",
              detail:
                "Elige una plantilla. Ajusta la foto, el texto y los colores. Agranda el precio y acomoda cada capa a tu manera.",
              Icon: Layers3,
            },
            {
              title: "Llévalo a tus clientes.",
              detail:
                "Revisa el resultado y descarga el archivo. Copia el texto y compártelo desde el celular o la computadora.",
              Icon: Share2,
            },
          ].map((step, i) => (
            <article key={step.title} className="border-t border-border pt-5">
              <div className="flex items-center justify-between">
                <span
                  className="text-5xl font-bold tracking-tight text-border"
                  aria-hidden
                >
                  0{i + 1}
                </span>
                <step.Icon className="h-6 w-6 text-accent" aria-hidden />
              </div>
              <h3 className="mt-6 text-xl font-bold tracking-tight">
                <span className="sr-only">Paso {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {step.detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StudioChannels({
  publishEnabled,
  aiEnabled,
}: {
  publishEnabled: boolean;
  aiEnabled: boolean;
}) {
  return (
    <section className="overflow-hidden py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="order-2 rounded-3xl bg-border-soft p-5 sm:p-8 lg:order-1">
          <div className={styles.formatWall}>
            <figure>
              <div className={styles.showcasePoster}>
                <StudioExamplePoster
                  example={STUDIO_EXAMPLES[1]}
                  format="square"
                />
              </div>
              <figcaption className="mt-3 text-center text-xs font-semibold text-muted-foreground">
                Publicación · 1:1
              </figcaption>
            </figure>
            <figure>
              <div className={styles.showcasePoster}>
                <StudioExamplePoster
                  example={STUDIO_EXAMPLES[1]}
                  format="story"
                />
              </div>
              <figcaption className="mt-3 text-center text-xs font-semibold text-muted-foreground">
                Historia · 9:16
              </figcaption>
            </figure>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">
            Una idea. Más posibilidades.
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Que se vea bien.
            <br />
            Donde lo compartas.
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground">
            De una publicación cuadrada a una historia vertical. Ajusta la
            composición y descarga el formato para Instagram, Facebook o
            WhatsApp.
          </p>
          <ul className="mt-6 space-y-4 text-sm">
            {[
              "Cuadrado, vertical, historias y banners",
              "PNG listo para descargar y texto para copiar",
              "Ajustes manuales y descargas sin gastar Tlacos",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                  aria-hidden
                />
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            Tú completas la publicación en la red elegida. Compartir por
            WhatsApp prepara el texto y enlace.
          </p>
          {publishEnabled && (
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              También puedes aplicar diseños en espacios de tu sitio y mesas con
              QR, con su vigencia y datos del catálogo.
            </p>
          )}
        </div>
      </div>
      {aiEnabled && (
        <div className="mx-auto mt-16 max-w-6xl px-5 sm:px-8">
          <div className="rounded-3xl bg-slate-950 px-6 py-9 text-white sm:px-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <Sparkles className="h-6 w-6 text-blue-400" aria-hidden />
                <h3 className="mt-4 text-2xl font-bold tracking-tight">
                  Un impulso creativo, cuando tú lo decidas.
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Pide una variante con IA y compárala con tu foto original. El
                  precio y los textos siguen en capas editables.
                </p>
              </div>
              <p className="shrink-0 text-sm leading-7">
                <strong className="text-lg">1 o 2 Tlacos</strong>
                <br />
                <span className="text-slate-400">
                  Según la calidad elegida.
                  <br />
                  Siempre confirmas antes.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
