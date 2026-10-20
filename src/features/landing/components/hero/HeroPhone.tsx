import { PhoneShell } from "@/features/landing/components/hero/phone/PhoneParts";
import { CheckoutView } from "@/features/landing/components/hero/phone/CheckoutView";
import { LoanView } from "@/features/landing/components/hero/phone/LoanView";
import { MenuView } from "@/features/landing/components/hero/phone/MenuView";
import { ScanView } from "@/features/landing/components/hero/phone/ScanView";
import { StorefrontView } from "@/features/landing/components/hero/phone/StorefrontView";
import { SubscriptionView } from "@/features/landing/components/hero/phone/SubscriptionView";
import { TrackerView } from "@/features/landing/components/hero/phone/TrackerView";

import type {
  HeroBeat,
  HeroPhoneControls,
  HeroPhoneView,
  HeroPhoneViewProps,
  HeroSandboxState,
} from "@/features/landing/interfaces/heroDemo";

const VIEWS: Record<HeroPhoneView, (props: HeroPhoneViewProps) => React.JSX.Element> = {
  scan: ScanView,
  menu: MenuView,
  tracker: TrackerView,
  subscription: SubscriptionView,
  loan: LoanView,
  storefront: StorefrontView,
  checkout: CheckoutView,
};

/**
 * La mitad del cliente: un celular que de verdad se puede usar. Refleja las
 * pantallas reales de `src/app/q/[token]/**` y del storefront.
 */
export function HeroPhone({
  beat,
  sandbox,
  controls,
  tapKey,
}: {
  beat: HeroBeat;
  sandbox: HeroSandboxState;
  controls: HeroPhoneControls;
  tapKey: number;
}) {
  const View = VIEWS[beat.phone.view];

  return (
    <PhoneShell>
      <div key={beat.key} className="animate-fade-in-up flex h-100 flex-col">
        <View sandbox={sandbox} controls={controls} />
      </div>
      {tapKey > 0 && (
        <span
          key={tapKey}
          className="animate-hero-tap pointer-events-none absolute bottom-3 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full bg-accent"
          aria-hidden
        />
      )}
    </PhoneShell>
  );
}
