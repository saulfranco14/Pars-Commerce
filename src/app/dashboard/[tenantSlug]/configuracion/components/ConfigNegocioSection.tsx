"use client";

interface ConfigNegocioSectionProps {
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  expressOrderEnabled: boolean;
  onExpressOrderChange: (v: boolean) => void;
}

const inputClass =
  "input-form mt-1 block w-full min-h-(--touch-target,44px) rounded-xl border border-border px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";
const labelClass = "block text-sm font-medium text-muted-foreground";

export function ConfigNegocioSection({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  expressOrderEnabled,
  onExpressOrderChange,
}: ConfigNegocioSectionProps) {
  return (
    <div className="space-y-4">
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
