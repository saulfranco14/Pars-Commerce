import { Check, QrCode, ScanLine } from "lucide-react";

import {
  PhoneFooter,
  PhoneHero,
  PhoneStatus,
} from "@/features/landing/components/hero/phone/PhoneParts";

import type { HeroPhoneViewProps } from "@/features/landing/interfaces/heroDemo";

export function ScanView({ sandbox, controls }: HeroPhoneViewProps) {
  const scan = () => controls.act({ type: "scan" });

  if (sandbox.scanned) {
    return (
      <>
        <PhoneHero kicker="Bienvenido" title="Mesa 4" />
        <PhoneStatus
          icon={Check}
          title="Conectado"
          detail="Ya puedes ver productos y pedir desde aquí"
        />
        <PhoneFooter label="Ver productos" onClick={controls.next} />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <button
          type="button"
          onClick={scan}
          aria-label="Escanear el QR de la mesa 4"
          className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-accent/30 bg-surface-raised transition-transform hover:border-accent active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <QrCode className="h-16 w-16 text-foreground" aria-hidden />
          <span
            className="animate-hero-scan-line absolute inset-x-3 top-3 h-0.5 rounded-full bg-accent"
            aria-hidden
          />
        </button>
        <div>
          <p className="flex items-center justify-center gap-1 text-sm font-bold text-foreground">
            <ScanLine className="h-3.5 w-3.5 text-accent" aria-hidden />
            Mesa 4
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Sin app · Sin registro
          </p>
        </div>
      </div>
      <PhoneFooter label="Escanear QR" icon={ScanLine} onClick={scan} />
    </>
  );
}
