import type { Metadata } from "next";

import { LandingNav } from "@/features/landing/components/sections/LandingNav";
import { LandingHero } from "@/features/landing/components/sections/LandingHero";
import { LandingStats } from "@/features/landing/components/sections/LandingStats";
import { LandingBusinessSolutions } from "@/features/landing/components/sections/LandingBusinessSolutions";
import { LandingPlatform } from "@/features/landing/components/sections/LandingPlatform";
import { LandingMesas } from "@/features/landing/components/sections/LandingMesas";
import { LandingHowItWorks } from "@/features/landing/components/sections/LandingHowItWorks";
import { LandingComingSoon } from "@/features/landing/components/sections/LandingComingSoon";
import { LandingPricing } from "@/features/landing/components/sections/LandingPricing";
import { LandingFaq } from "@/features/landing/components/sections/LandingFaq";
import { LandingFooter } from "@/features/landing/components/sections/LandingFooter";

const TITLE = "Tu cliente pide y paga desde su celular";
const DESCRIPTION =
  "Mesas con QR, tienda en línea, cuotas y crédito en una sola cuenta. Tu cliente pide y paga desde su celular y tú lo ves en tu panel al instante. Empieza gratis.";

export const metadata: Metadata = {
  title: { absolute: `Tlaco · ${TITLE}` },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: `${TITLE}. Tú lo ves al instante.`, description: DESCRIPTION, url: "/" },
};

/**
 * Narrativa pensada para tráfico de campañas, en este orden a propósito:
 *
 *  1. Hero        — la diferencia en una frase + la demo tocable.
 *  2. Stats       — las promesas concretas (tiempo, costo, sin terminal).
 *  3. Soluciones  — tu giro ya viene armado: el freno "me da flojera empezar".
 *  4. Plataforma / Mesas — todo lo que hace y la función estrella a fondo.
 *  5. Cómo empezar — qué tiene que hacer él, en tres pasos.
 *  6. Precios / FAQ — objeciones. "Lo que viene" va al final: lo que aún no
 *     existe no debe interrumpir el argumento de venta.
 *
 * El CTA de cierre vive en el footer; tener otro bloque igual justo antes
 * repetía la misma pregunta dos veces seguidas.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="h-13" aria-hidden />
      <main>
        <LandingHero />
        <LandingStats />
        <LandingBusinessSolutions />
        <LandingPlatform />
        <LandingMesas />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingFaq />
        <LandingComingSoon />
      </main>
      <LandingFooter />
    </div>
  );
}
