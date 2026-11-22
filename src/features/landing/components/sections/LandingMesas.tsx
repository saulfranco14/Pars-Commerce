import { MesasPainSolution } from "@/features/landing/components/mesas/MesasPainSolution";
import { HomeCta } from "@/features/landing/components/shared/HomeCta";
import { LandingSection } from "@/features/landing/components/shared/LandingSection";
import { SectionHeader } from "@/features/landing/components/shared/SectionHeader";

export function LandingMesas() {
  return (
    <LandingSection id="mesas-qr">
      <SectionHeader
        eyebrow="Mesas y código QR"
        title="Pega un QR y nadie vuelve a anotar pedidos."
        accent="Tú solo entregas."
        lead="Tu cliente escanea con su cámara, arma su pedido, ve cuándo está listo y paga desde su celular."
      />
      <MesasPainSolution />
      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <HomeCta location="mesas" />
        <p className="text-sm text-muted-foreground">$0 al mes para empezar · Sin terminal</p>
      </div>
    </LandingSection>
  );
}
