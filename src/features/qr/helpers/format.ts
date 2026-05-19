/**
 * Shared formatters used across QR customer-facing screens.
 * Keep pure: no React, no side-effects.
 */

export function formatCurrency(value: number): string {
  return `$${Number(value).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
  })}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
