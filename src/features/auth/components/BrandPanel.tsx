import Image from "next/image";
import { HIGHLIGHTS } from "@/features/auth/constants/loginHighlights";

type BrandPanelProps = {
  title?: string;
  subtitle?: string;
};

export function BrandPanel({
  title = "Bienvenido de vuelta",
  subtitle = "Accede a tu dashboard para gestionar tu negocio, revisar ordenes y hacer crecer tus ventas.",
}: BrandPanelProps) {
  return (
    <div className="relative hidden lg:flex lg:flex-1 items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-accent/10 blur-[100px]"
        aria-hidden
      />

      <div className="relative z-10 max-w-sm px-8">
        <div className="flex items-center gap-3 mb-8">
          <Image
            src="/android-chrome-192x192.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="text-xl font-bold text-foreground">
            Pars Commerce
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          {subtitle}
        </p>

        <div className="mt-8 space-y-3">
          {HIGHLIGHTS.map(({ icon: Icon, text, accent }) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-all duration-200 hover:shadow-soft cursor-default"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <span className="text-sm text-foreground">{text}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted-foreground/60">
          Mas de 50 negocios ya confian en Pars Commerce
        </p>
      </div>
    </div>
  );
}
