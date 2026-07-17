import { LandingNav } from "@/features/landing/components/sections/LandingNav";
import { LandingHero } from "@/features/landing/components/sections/LandingHero";
import { LandingLogos } from "@/features/landing/components/sections/LandingLogos";
import { LandingFeatures } from "@/features/landing/components/sections/LandingFeatures";
import { LandingHowItWorks } from "@/features/landing/components/sections/LandingHowItWorks";
import { LandingBentoShowcase } from "@/features/landing/components/sections/LandingBentoShowcase";
import { LandingShowflow } from "@/features/landing/components/sections/LandingShowflow";
import { LandingPricing } from "@/features/landing/components/sections/LandingPricing";
import { LandingFaq } from "@/features/landing/components/sections/LandingFaq";
import { LandingCta } from "@/features/landing/components/sections/LandingCta";
import { LandingFooter } from "@/features/landing/components/sections/LandingFooter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
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
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
