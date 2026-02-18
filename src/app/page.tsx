import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
<<<<<<< Updated upstream
import { LandingLogos } from "@/components/landing/LandingLogos";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingBentoShowcase } from "@/components/landing/LandingBentoShowcase";
import { LandingShowflow } from "@/components/landing/LandingShowflow";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFaq } from "@/components/landing/LandingFaq";
import { LandingFooter } from "@/components/landing/LandingFooter";
=======
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingHowItWorks } from "@/components/landing/LandingHowItWorks";
import { LandingCta } from "@/components/landing/LandingCta";
>>>>>>> Stashed changes

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
<<<<<<< Updated upstream
      {/* Spacer for fixed nav */}
      <div className="h-[52px]" aria-hidden />
      <main>
        <LandingHero />
        <LandingLogos />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingBentoShowcase />
        <LandingShowflow />
        <LandingPricing />
        <LandingFaq />
      </main>
      <LandingFooter />
=======
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingCta />
      </main>
>>>>>>> Stashed changes
    </div>
  );
}
