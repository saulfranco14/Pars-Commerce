"use client";

import {
  describeRole,
  roleLabel,
} from "@/features/equipo/constants/roleDescriptions";

import type { MemberRoleSelectProps } from "@/features/equipo/interfaces/memberRoleSelect";

/**
 * Selector de rol de un miembro del equipo, con la descripción de lo que ese
 * rol podrá hacer justo debajo.
 *
 * Existe porque la pantalla de equipo pinta la misma tabla dos veces (una para
 * móvil, otra para escritorio) y el select estaba copiado en ambas mostrando
 * el nombre crudo del rol (`cashier`, `waiter`) y sin decir qué implica
 * elegirlo. Cambiarle el rol a alguien es un cambio de permisos: quien lo hace
 * tiene que ver la consecuencia antes de guardarla, igual que al invitar.
 */
export function MemberRoleSelect({
  roles,
  value,
  onChange,
  disabled = false,
  ariaLabel,
  className = "",
}: MemberRoleSelectProps) {
  const selected = roles.find((r) => r.id === value);

  return (
    <div className={`min-w-0 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input-form select-custom min-h-11 w-full cursor-pointer rounded-xl border px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={ariaLabel}
      >
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {roleLabel(r.name)}
          </option>
        ))}
      </select>
      {selected && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          {describeRole(selected.name, selected.permissions ?? [])}
        </p>
      )}
    </div>
  );
}
