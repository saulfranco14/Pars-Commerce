import { CreditCard, Globe, Smartphone, Shield, Truck } from "lucide-react";

const INTEGRATIONS = [
  { icon: CreditCard, label: "MercadoPago" },
  { icon: Globe, label: "Sitio web" },
  { icon: Smartphone, label: "Mobile" },
  { icon: Shield, label: "Seguridad" },
  { icon: Truck, label: "Envios" },
] as const;

export function LandingLogos() {
  return (
    <section className="border-t border-border py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Integrado con herramientas que ya conoces
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {INTEGRATIONS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 text-muted opacity-60 transition-opacity duration-200 hover:opacity-100"
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
