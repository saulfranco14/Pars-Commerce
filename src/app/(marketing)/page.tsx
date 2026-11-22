import type { Metadata } from "next";
import { studioFlags } from "@/features/studio/services/studioFlags";
import { LANDING_NAV_LINKS } from "@/features/landing/constants/navigation";

import { LandingNav } from "@/features/landing/components/sections/LandingNav";
import { LandingHero } from "@/features/landing/components/sections/LandingHero";
import { LandingTryIt } from "@/features/landing/components/sections/LandingTryIt";
import { LandingStats } from "@/features/landing/components/sections/LandingStats";
import { LandingStudio } from "@/features/landing/components/sections/LandingStudio";
import { LandingBusinessSolutions } from "@/features/landing/components/sections/LandingBusinessSolutions";
import { LandingPlatform } from "@/features/landing/components/sections/LandingPlatform";
import { LandingMesas } from "@/features/landing/components/sections/LandingMesas";
import { LandingHowItWorks } from "@/features/landing/components/sections/LandingHowItWorks";
import { LandingComingSoon } from "@/features/landing/components/sections/LandingComingSoon";
import { LandingPricing } from "@/features/landing/components/sections/LandingPricing";
import { LandingFaq } from "@/features/landing/components/sections/LandingFaq";
import { LandingFooter } from "@/features/landing/components/sections/LandingFooter";

import { resolveHeroScene } from "@/features/landing/helpers/resolveHeroScene";
import { heroRegisterHref } from "@/features/landing/helpers/heroRegisterHref";
import { homeStructuredData } from "@/features/landing/helpers/homeStructuredData";
import { getPublicAppUrl } from "@/lib/env/appUrl";

// The tab title carries what people search for; the visible H1 keeps the campaign promise.
const SEARCH_TITLE = "Tlaco · Pedidos y cobros con QR para tu negocio, gratis";
const HEADLINE = "Tu cliente pide y paga desde su celular. Tú lo ves al instante.";
const DESCRIPTION =
  "Mesas con QR, tienda en línea, cuotas y crédito en una sola cuenta. Tu cliente pide y paga desde su celular y tú lo ves al instante. Empieza gratis.";

export const metadata: Metadata = {
  title: { absolute: SEARCH_TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HEADLINE,
    description: DESCRIPTION,
    url: "/",
    locale: "es_MX",
    siteName: "Tlaco",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: HEADLINE, description: DESCRIPTION },
};

/**
 * Narrativa pensada para tráfico de campañas, en este orden a propósito:
 *
 *  1. Hero        — la diferencia en una frase + la escena animada; el giro
 *                   sale del anuncio (`?giro=` / `utm_content`).
 *     Pruébalo    — la demo tocable, justo debajo.
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
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const scene = resolveHeroScene(await searchParams);
  const studio = studioFlags().public;
  const links = studio
    ? [...LANDING_NAV_LINKS, { label: "Studio", href: "/studio" }]
    : LANDING_NAV_LINKS;
  const structured = homeStructuredData(getPublicAppUrl(), DESCRIPTION);
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured).replace(/</g, "\\u003c") }}
      />
      <LandingNav links={links} />
      <div className="h-13" aria-hidden />
      <main>
        <LandingHero scene={scene} registerHref={heroRegisterHref(scene)} />
        <LandingTryIt />
        <LandingStats />
        {studio && <LandingStudio />}
        <LandingBusinessSolutions />
        <LandingPlatform enabledProducts={studio ? ["studio"] : []} />
        <LandingMesas />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingFaq studioEnabled={studio} />
        <LandingComingSoon />
      </main>
      <LandingFooter links={links} />
    </div>
  );
}
