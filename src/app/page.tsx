import { LandingNav } from "@/features/landing/components/LandingNav";
import { LandingHero } from "@/features/landing/components/LandingHero";
import { LandingLogos } from "@/features/landing/components/LandingLogos";
import { LandingFeatures } from "@/features/landing/components/LandingFeatures";
import { LandingHowItWorks } from "@/features/landing/components/LandingHowItWorks";
import { LandingBentoShowcase } from "@/features/landing/components/LandingBentoShowcase";
import { LandingShowflow } from "@/features/landing/components/LandingShowflow";
import { LandingPricing } from "@/features/landing/components/LandingPricing";
import { LandingFaq } from "@/features/landing/components/LandingFaq";
import { LandingCta } from "@/features/landing/components/LandingCta";
import { LandingFooter } from "@/features/landing/components/LandingFooter";

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
