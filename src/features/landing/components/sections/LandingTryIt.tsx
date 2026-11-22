import { HeroLiveDemo } from "@/features/landing/components/hero/HeroLiveDemo";
import { LandingSection } from "@/features/landing/components/shared/LandingSection";
import { SectionHeader } from "@/features/landing/components/shared/SectionHeader";

export function LandingTryIt() {
  return (
    <LandingSection id="demo" width="max-w-5xl">
      <SectionHeader
        eyebrow="Pruébalo tú"
        title="Toca el celular de tu cliente y"
        accent="mira tu panel."
        lead="Agrega productos, envía el pedido y paga como lo haría tu cliente."
      />
      <div className="mt-10">
        <HeroLiveDemo />
      </div>
    </LandingSection>
  );
}
