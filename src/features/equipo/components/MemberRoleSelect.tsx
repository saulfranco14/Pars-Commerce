"use client";

import {
  describeRole,
  roleLabel,
} from "@/features/equipo/constants/roleDescriptions";

import type { MemberRoleSelectProps } from "@/features/equipo/interfaces/memberRoleSelect";

// Changing someone's role changes their permissions, so the consequence is
// shown before saving.
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
