import { LandingNav } from "@/features/landing/components/sections/LandingNav";
import { LandingHero } from "@/features/landing/components/sections/LandingHero";
import { LandingLogos } from "@/features/landing/components/sections/LandingLogos";
import { LandingPlatform } from "@/features/landing/components/sections/LandingPlatform";
import { LandingMesas } from "@/features/landing/components/sections/LandingMesas";
import { LandingHowItWorks } from "@/features/landing/components/sections/LandingHowItWorks";
import { LandingShowflow } from "@/features/landing/components/sections/LandingShowflow";
import { LandingComingSoon } from "@/features/landing/components/sections/LandingComingSoon";
import { LandingPricing } from "@/features/landing/components/sections/LandingPricing";
import { LandingFaq } from "@/features/landing/components/sections/LandingFaq";
import { LandingCta } from "@/features/landing/components/sections/LandingCta";
import { LandingFooter } from "@/features/landing/components/sections/LandingFooter";

/**
 * Narrativa de la landing, en este orden a propósito:
 *
 *  1. Hero        — VE el producto funcionando (dos dispositivos en vivo).
 *  2. Logos       — prueba social rápida.
 *  3. Plataforma  — todo lo que hace, contado desde el dueño Y desde el cliente.
 *  4. Mesas/QR    — la función estrella, a fondo y tocable.
 *  5. Cómo empezar / Showflow — qué tiene que hacer él.
 *  6. Lo que viene / Precios / FAQ / CTA.
 *
 * `LandingFeatures` y `LandingBentoShowcase` se retiraron: eran versiones
 * parciales del inventario que `LandingPlatform` ya cuenta completo y con las
 * dos perspectivas. Tres secciones de features seguidas competían entre ellas.
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="h-[52px]" aria-hidden />
      <main>
        <LandingHero />
        <LandingLogos />
        <LandingPlatform />
        <LandingMesas />
        <LandingHowItWorks />
        <LandingShowflow />
        <LandingComingSoon />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
