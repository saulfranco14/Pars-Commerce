import type { LucideIcon } from "lucide-react";

import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { HIGHLIGHTS } from "@/features/auth/constants/loginHighlights";

interface BrandItem {
  icon: LucideIcon;
  text: string;
  accent: string;
}

interface BrandPanelProps {
  title?: string;
  subtitle?: string;
  /** Anima la caída de la moneda al montar. */
  animated?: boolean;
  /** Lista de tarjetas. Login y registro muestran contenido distinto —
   *  "por qué confiar" vs. "por qué registrarte" — pero con el mismo molde
   *  visual, que es lo que las hace sentir parte del mismo producto. */
  items?: BrandItem[];
  /** Línea de cierre bajo la lista (y bajo `children`, si lo hay). */
  footnote?: string;
  /** Contenido extra específico de una pantalla, como el recuadro de precio
   *  del registro. Login no lo usa. */
  children?: React.ReactNode;
}

export function BrandPanel({
  title = "Bienvenido de vuelta",
  subtitle = "Accede a tu panel para gestionar tu negocio, revisar órdenes y hacer crecer tus ventas.",
  items = HIGHLIGHTS,
  footnote = "Más de 50 negocios ya confían en Tlaco",
  animated = false,
  children,
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
        {/* Este panel no tiene entrada propia, así que usa el retardo por
            defecto: la moneda cae sobre un fondo quieto. */}
        <div className="mb-8">
          <TlacoLogo size="xl" animated={animated} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          {subtitle}
        </p>

        <div className="mt-8 space-y-3">
          {items.map(({ icon: Icon, text, accent }) => (
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

        {children}

        <p className="mt-8 text-xs text-muted-foreground/60">{footnote}</p>
      </div>
    </div>
  );
}
