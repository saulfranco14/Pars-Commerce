import type { Metadata } from "next";
import { studioFlags } from "@/features/studio/services/studioFlags";
import { LANDING_NAV_LINKS } from "@/features/landing/constants/navigation";

import { LandingNav } from "@/features/landing/components/sections/LandingNav";
import { LandingHero } from "@/features/landing/components/sections/LandingHero";
import { LandingTryIt } from "@/features/landing/components/sections/LandingTryIt";
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
import { FAQS } from "@/features/landing/constants/faqs";

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
 *  2. Pruébalo    — la demo tocable, justo debajo.
 *  3. Soluciones  — "¿sirve para mi giro?": tu catálogo ya viene armado.
 *  4. Mesas / Plataforma — la función estrella a fondo y todo lo demás.
 *  5. Studio      — complemento de pago, después de las razones para entrar.
 *  6. Cómo empezar, Precios y FAQ — objeciones. "Lo que viene" va al final:
 *     lo que aún no existe no debe interrumpir el argumento de venta.
 *
 * Las secciones alternan fondo (`LandingSection`) en vez de líneas divisorias
 * y comparten encabezado (`SectionHeader`); el inicio, Studio y el cierre son
 * las bandas oscuras.
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
  const structured = homeStructuredData(getPublicAppUrl(), DESCRIPTION, FAQS);
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
        <LandingBusinessSolutions />
        <LandingMesas />
        <LandingPlatform enabledProducts={studio ? ["studio"] : []} />
        {studio && <LandingStudio />}
        <LandingHowItWorks />
        <LandingPricing />
        <LandingFaq studioEnabled={studio} />
        <LandingComingSoon />
      </main>
      <LandingFooter links={links} />
    </div>
  );
}
