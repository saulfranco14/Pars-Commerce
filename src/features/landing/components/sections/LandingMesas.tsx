import Link from "next/link";
import { ArrowRight, QrCode } from "lucide-react";

import { MesasPainSolution } from "@/features/landing/components/mesas/MesasPainSolution";

export function LandingMesas() {
  return (
    <section
      id="mesas-qr"
      className="border-t border-border bg-surface/50 py-16 sm:py-10"
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
            Pega un QR y nadie vuelve a anotar pedidos.{" "}
            <span className="text-accent">Tú solo entregas.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-lg">
            Pega un QR en la mesa o el mostrador. Tu cliente escanea con su
            cámara, arma su pedido, ve cuándo está listo y paga desde su
            celular. Tu equipo solo entrega.
          </p>
        </div>

        <MesasPainSolution />

        <div className="mt-14 flex flex-col items-center gap-3 text-center">
          <Link
            href="/registro"
            className="group inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
          >
            Crear mi QR gratis
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <p className="text-sm text-muted-foreground">
            $0 al mes para empezar · Sin terminal
          </p>
        </div>
      </div>
    </section>
  );
}
