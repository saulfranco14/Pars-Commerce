"use client";

import Link from "next/link";
import { ArrowRight, Tags } from "lucide-react";

import { SettingToggleCard } from "@/features/configuracion/components/cobros/SettingToggleCard";

export function ConfigPromotionsSection({
  enabled,
  onEnabledChange,
  tenantSlug,
}: {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  tenantSlug: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Promociones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Controla si las promociones marcadas para el local se aplican al cobrar.
        </p>
      </div>

      <SettingToggleCard
        icon={Tags}
        title="Aplicar promociones en ventas del local"
        description="Afecta mesas QR, pedidos tomados por personal y kiosco. El sitio web conserva sus promociones."
        enabled={enabled}
        onToggle={onEnabledChange}
      >
        <p className="text-sm text-muted-foreground">
          Desactivarlo no elimina ni pausa promociones. Sus canales se conservarán para cuando vuelvas a activarlo.
        </p>
      </SettingToggleCard>

      <Link
        href={`/dashboard/${tenantSlug}/promociones`}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-accent/40"
      >
        Administrar promociones
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
