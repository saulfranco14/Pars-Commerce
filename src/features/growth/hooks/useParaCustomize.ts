import { useState } from "react";

import { PARA_CUSTOMIZE_STEPS } from "@/features/growth/constants/paraCustomize";

import type { ParaColorKey, ParaCustomization, ParaHoursKey } from "@/features/growth/interfaces/para";

/** «Hazla tuya» choices; the claim link carries them so the new store can start that way. */
export function useParaCustomize(claimUrl: string) {
  const [choice, setChoice] = useState<ParaCustomization>({ color: null, price: null, hours: null });
  const done = [choice.color, choice.price, choice.hours].filter((value) => value !== null).length;

  const params = new URLSearchParams();
  if (choice.color) params.set("color", choice.color);
  if (choice.price !== null) params.set("precio", String(choice.price));
  if (choice.hours) params.set("horario", choice.hours);
  const query = params.toString();

  return {
    choice,
    done,
    complete: done === PARA_CUSTOMIZE_STEPS,
    claimHref: query ? `${claimUrl}${claimUrl.includes("?") ? "&" : "?"}${query}` : claimUrl,
    setColor: (color: ParaColorKey) => setChoice((current) => ({ ...current, color })),
    setPrice: (price: number) => setChoice((current) => ({ ...current, price })),
    setHours: (hours: ParaHoursKey) => setChoice((current) => ({ ...current, hours })),
  };
}
