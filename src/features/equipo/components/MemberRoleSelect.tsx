"use client";

import { roleLabel } from "@/features/equipo/constants/roleDescriptions";

import type { MemberRoleSelectProps } from "@/features/equipo/interfaces/memberRoleSelect";

export function MemberRoleSelect({
  roles,
  value,
  onChange,
  disabled = false,
  ariaLabel,
  className = "",
}: MemberRoleSelectProps) {
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
    </div>
  );
}
