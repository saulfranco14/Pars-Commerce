import { STATIONS } from "@/features/operaciones/constants/stations";

/**
 * Where "Volver" goes from an order. A board passes ?volver=<its own path>;
 * only an Operación station of this same business is honored, so the
 * parameter can never send someone elsewhere.
 */
export function orderBackLink(tenantSlug: string, volver: string | null | undefined): { href: string; label: string } {
  const fallback = { href: `/dashboard/${tenantSlug}/ordenes`, label: "Volver a órdenes" };
  const prefix = `/dashboard/${tenantSlug}/operacion/`;
  if (!volver?.startsWith(prefix)) return fallback;
  const station = STATIONS.find((entry) => `${prefix}${entry.key}` === volver);
  return station ? { href: volver, label: `Volver a ${station.label}` } : fallback;
}
