import {
  MP_FEE_FIXED_MXN,
  MP_FEE_PERCENT,
  MP_IVA_PERCENT,
} from "@/constants/commissionConfig";
import { STUDIO_QUALITIES } from "../constants/studio";

/** Conservative exchange rate: a stronger peso only widens the margin. */
export const STUDIO_USD_MXN = 20;
/** Gemini image output plus the product photo sent as input, per image (Nov 2026 price list). */
export const STUDIO_IMAGE_COST_USD = {
  economy: 0.036,
  premium: 0.136,
} as const;
export const STUDIO_MIN_MARGIN_MXN = 1;

/** What Tlaco keeps per Tlaco of a plan or pack after Mercado Pago and IVA. */
export function studioNetPerTlaco(priceMxn: number, tlacos: number): number {
  const fee = priceMxn * MP_FEE_PERCENT + MP_FEE_FIXED_MXN;
  return (priceMxn - fee) / (1 + MP_IVA_PERCENT) / tlacos;
}

/** Pesos left per image when every Tlaco of that plan or pack goes to images of this quality. */
export function studioImageMargin(
  priceMxn: number,
  tlacos: number,
  quality: keyof typeof STUDIO_IMAGE_COST_USD,
): number {
  const perImage = STUDIO_QUALITIES.find((q) => q.value === quality)?.cost ?? 1;
  return (
    studioNetPerTlaco(priceMxn, tlacos) * perImage -
    STUDIO_IMAGE_COST_USD[quality] * STUDIO_USD_MXN
  );
}
