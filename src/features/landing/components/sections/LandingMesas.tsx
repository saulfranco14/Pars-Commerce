import Link from "next/link";
import { ArrowRight, QrCode } from "lucide-react";

import { MesasDemoSimulator } from "@/features/landing/components/mesas/MesasDemoSimulator";
import { MesasPainSolution } from "@/features/landing/components/mesas/MesasPainSolution";
import { MesasAudiencePicker } from "@/features/landing/components/mesas/MesasAudiencePicker";

/**
 * Sección de mesas + código QR. Es la función más difícil de "contar" con texto,
 * así que el centro es una demo que el prospecto puede tocar: ve las MISMAS
 * pantallas que vería su cliente, en el mismo orden.
 *
 * Orden intencional: primero se reconoce en el problema (pain/solution), luego
 * vive el flujo (demo), luego confirma que aplica a su rubro (audiencias), y
 * hasta entonces se le pide registrarse.
 */
export function LandingMesas() {
  return (
    <section
      id="mesas-qr"
      className="border-t border-border bg-surface/50 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent"
            aria-hidden
          />
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3.5 py-1.5 text-sm font-medium text-accent">
            <QrCode className="h-3.5 w-3.5" aria-hidden />
            Mesas y código QR
          </div>
          <h2 className="mx-auto mt-5 max-w-3xl text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Tu cliente pide y paga desde su celular.{" "}
            <span className="text-accent">Tú solo entregas.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-lg">
            Pega un QR en la mesa o el mostrador. Tu cliente escanea, arma su
            pedido, ve cuándo está listo y paga solo — sin app, sin terminal y
            sin que tu personal anote nada.
          </p>
        </div>

        <MesasPainSolution />

        <div className="mt-20">
          <div className="text-center">
            <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Míralo como lo vive tu cliente
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted-foreground">
              Estas son las pantallas reales de la plataforma. Toca cada paso y
              recórrelo tú mismo antes de crear tu cuenta.
            </p>
          </div>
          <MesasDemoSimulator />
        </div>

        <MesasAudiencePicker />

        <div className="mt-14 flex flex-col items-center gap-3 text-center">
          <Link
            href="/registro"
            className="group inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background sm:w-auto"
          >
            Crear mi QR gratis
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <p className="text-sm text-muted-foreground">
            Sin costo para empezar · Sin terminal · Sin mensualidad
          </p>
        </div>
      </div>
    </section>
  );
}
