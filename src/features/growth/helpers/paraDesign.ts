import { PARA_DESIGNS } from "@/features/growth/constants/paraDesigns";

import type { ParaDesign } from "@/features/growth/interfaces/para";

/** Same split as SQL: the first 8 hex digits of the token hash, modulo the number of designs. */
export function paraDesignFromHash(tokenHash: string): ParaDesign {
  return PARA_DESIGNS[parseInt(tokenHash.slice(0, 8), 16) % PARA_DESIGNS.length];
}

/** `?d=` lets the team preview a design; prospects never get that parameter. */
export function requestedParaDesign(raw: string | string[] | undefined): ParaDesign | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return PARA_DESIGNS.find((design) => design === value) ?? null;
}
