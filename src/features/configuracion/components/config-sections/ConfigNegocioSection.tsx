"use client";

import { LogoUpload } from "@/components/LogoUpload";
import type { ConfigNegocioSectionProps } from "@/features/configuracion/interfaces/sections";
import {
  inputClass,
  labelClass,
} from "@/features/configuracion/constants/formClasses";

export function ConfigNegocioSection({
  tenantId,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  logoUrl,
  onLogoChange,
  logoError,
  logoSaving,
  expressOrderEnabled,
  onExpressOrderChange,
}: ConfigNegocioSectionProps) {
  return (
    <div className="space-y-4">
      <LogoUpload
        tenantId={tenantId}
        currentUrl={logoUrl}
        onUploaded={onLogoChange}
        saving={logoSaving}
        saveError={logoError}
      />
      <div>
        <label htmlFor="config-name" className={labelClass}>
          Nombre del negocio
        </label>
        <input
          id="config-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          className={inputClass}
          placeholder="Ej. Lavado express"
        />
      </div>
      <div>
        <label htmlFor="config-description" className={labelClass}>
          Descripción (opcional)
        </label>
        <textarea
          id="config-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder="Breve descripción del negocio"
        />
      </div>
      <div className="rounded-xl border border-border bg-border-soft/60 p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Flujo de órdenes
        </h2>
        <label className="mt-3 flex min-h-(--touch-target,44px) cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={expressOrderEnabled}
            onChange={(e) => onExpressOrderChange(e.target.checked)}
            className="mt-1.5 h-5 w-5 shrink-0 rounded border-border accent-accent"
          />
          <span className="text-sm text-muted-foreground">
            Orden Express. Permite crear el pedido y pagar de inmediato, ideal
            para cobros rápidos sin asignación ni seguimiento.
          </span>
        </label>
      </div>
    </div>
  );
}
