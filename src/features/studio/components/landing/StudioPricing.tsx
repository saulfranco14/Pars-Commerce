import { FeedbackLink as Link } from "@/components/navigation/FeedbackLink";
import { ArrowRight, Check, Layers3, Library, Sparkles } from "lucide-react";
import { formatCurrency } from "@/features/qr/helpers/format";
import { StudioEntryCta } from "./StudioEntryCta";
import type { StudioPack, StudioPlan } from "../../interfaces/studio";

export function StudioPricing({
  plans,
  packs,
  status,
  checkoutEnabled,
  aiEnabled,
}: {
  plans: StudioPlan[];
  packs: StudioPack[];
  status: "live" | "preview" | "unavailable";
  checkoutEnabled: boolean;
  aiEnabled: boolean;
}) {
  return (
    <section
      id="precios"
      className="scroll-mt-20 border-y border-border bg-surface py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">
            Espacio para tu próxima gran idea
          </p>
          <h2 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Crea a tu ritmo.
          </h2>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            {aiEnabled
              ? "Un editor completo en cada membresía. Elige cuántos Tlacos quieres tener para tus propuestas con IA."
              : "Tu editor, las plantillas y las descargas están incluidos en todas las membresías."}
          </p>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Complemento por negocio, contratado por separado de tu plan
            operativo de Tlaco.
          </p>
        </div>
        {status === "preview" && (
          <p className="mx-auto mt-7 max-w-2xl rounded-xl border border-border bg-background px-5 py-3 text-center text-xs leading-6 text-muted-foreground">
            <strong className="font-semibold text-foreground">
              Vista previa local de los precios de lanzamiento.
            </strong>{" "}
            La contratación todavía no está disponible. Estas tarifas son las
            aprobadas para preparar la presentación.
          </p>
        )}
        {plans.length ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const featured = plan.code === "pro";
              return (
                <article
                  key={plan.code}
                  className={`relative flex flex-col rounded-3xl border p-6 sm:p-8 ${featured ? "border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-950/10" : "border-border bg-background"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    {featured && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold tracking-wide text-blue-300">
                        MÁS POSIBILIDADES
                      </span>
                    )}
                  </div>
                  <p
                    className={`mt-2 text-sm ${featured ? "text-slate-400" : "text-muted-foreground"}`}
                  >
                    {plan.code === "basic"
                      ? "Dale forma a tus primeras ideas."
                      : featured
                        ? "Dale continuidad a tu creatividad."
                        : "Más contenido para tu negocio."}
                  </p>
                  <p className="mt-8 text-5xl font-bold tracking-tight tabular-nums">
                    {formatCurrency(plan.amount_mxn)}
                    <span
                      className={`ml-1 text-sm font-normal tracking-normal ${featured ? "text-slate-400" : "text-muted-foreground"}`}
                    >
                      / mes
                    </span>
                  </p>
                  <p
                    className={`mt-2 text-xs ${featured ? "text-slate-400" : "text-muted-foreground"}`}
                  >
                    MXN · IVA incluido
                  </p>
                  <p
                    className={`mt-7 border-y py-4 text-sm ${featured ? "border-white/10" : "border-border"}`}
                  >
                    <strong className="text-2xl">{plan.monthly_tlacos}</strong>{" "}
                    Tlacos cada mes
                  </p>
                  <ul className="my-7 space-y-4 text-sm">
                    {[
                      "Editor de capas y plantillas",
                      "Todos los formatos",
                      "Edición y descargas: 0 Tlacos",
                      "Biblioteca y versiones de tus diseños",
                    ].map((text) => (
                      <li key={text} className="flex items-start gap-2.5">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-blue-400" : "text-accent"}`}
                          aria-hidden
                        />
                        {text}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <StudioEntryCta
                      location="pricing"
                      plan={plan.code}
                      label={
                        status === "live" && checkoutEnabled
                          ? `Elegir ${plan.name}`
                          : "Explorar Studio"
                      }
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border bg-background p-6 text-center">
            <p className="font-semibold">
              Las membresías no están disponibles en este momento.
            </p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Puedes seguir explorando los ejemplos y las herramientas de
              Studio.
            </p>
            <Link
              href="#vista-del-editor"
              className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent"
            >
              Probar la demostración
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
        {packs.length > 0 && (
          <div className="mt-8 rounded-2xl border border-border px-5 py-6 sm:px-7">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <h3 className="font-bold">¿Una idea más? Recarga Tlacos.</h3>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  Compra única. Tus Tlacos comprados se conservan.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                {packs.map((pack) => (
                  <p
                    key={pack.code}
                    className="min-w-0 border-l border-border pl-3 sm:pl-5"
                  >
                    <strong className="block text-sm sm:text-base">
                      {pack.tlacos} Tlacos
                    </strong>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatCurrency(pack.amount_mxn)} MXN
                    </span>
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-6 border-t border-border pt-6">
              <p className="text-lg font-bold tracking-tight">
                Una imagen. Muchas publicaciones.
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
                Aprovecha más cada Tlaco: reutiliza tu diseño, cambia el mensaje
                y adáptalo a una publicación, una historia o un banner. No
                necesitas otra generación con IA para cada ajuste.
              </p>
              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <div>
                  <Sparkles className="h-5 w-5 text-accent" aria-hidden />
                  <p className="mt-3 text-sm font-semibold">
                    IA solo cuando la eliges
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {aiEnabled
                      ? "Generar una imagen cuesta "
                      : "Cuando la IA esté disponible, generar una imagen costará "}
                    <strong className="text-foreground">
                      1 Tlaco en económica
                    </strong>{" "}
                    o <strong className="text-foreground">2 en premium</strong>.
                    Confirmas el costo antes de generar.
                  </p>
                </div>
                <div>
                  <Layers3 className="h-5 w-5 text-accent" aria-hidden />
                  <p className="mt-3 text-sm font-semibold">
                    Seguir creando: 0 Tlacos
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    Con tu membresía, editar textos, colores y formatos y volver
                    a descargar consume{" "}
                    <strong className="text-foreground">0 Tlacos</strong>. Usa
                    también tus propias fotos sin generar con IA.
                  </p>
                </div>
                <div>
                  <Library className="h-5 w-5 text-accent" aria-hidden />
                  <p className="mt-3 text-sm font-semibold">
                    Tus diseños se quedan contigo
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    Conservas tu biblioteca y puedes descargar archivos ya
                    guardados aunque termine la membresía. Para seguir editando,
                    necesitas una membresía vigente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-6 text-muted-foreground">
          Los Tlacos mensuales vencen al terminar el periodo; se usan antes de
          los comprados. La IA requiere membresía vigente y saldo. Cancela la
          renovación cuando quieras y conserva tu periodo pagado. Los cambios de
          plan aplican al renovar, sin prorrateo.
        </p>
      </div>
    </section>
  );
}
