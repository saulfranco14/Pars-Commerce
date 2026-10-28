import { describe, expect, it } from "vitest";

import { suggestWhatsappStep } from "@/features/growth/helpers/suggestWhatsappStep";

import type { GrowthLead } from "@/features/growth/interfaces/lead";

const NOW = new Date("2026-10-27T18:00:00Z");
const base: Pick<GrowthLead, "stage" | "phone_e164" | "phone_status" | "whatsapp_attempts" | "last_whatsapp_at"> = {
  stage: "nuevo",
  phone_e164: "+525563162174",
  phone_status: "desconocido",
  whatsapp_attempts: 0,
  last_whatsapp_at: null,
};
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

describe("suggestWhatsappStep", () => {
  it("starts with the first message when nobody has written yet", () => {
    expect(suggestWhatsappStep(base, NOW)).toMatchObject({ step: "m1", wait: false });
  });

  it("asks to wait before the 3-day follow-up, then suggests it", () => {
    const sent = { ...base, stage: "contactado" as const, phone_status: "enviado" as const, whatsapp_attempts: 1 };
    expect(suggestWhatsappStep({ ...sent, last_whatsapp_at: daysAgo(1) }, NOW)).toMatchObject({ step: "seguimiento", wait: true });
    expect(suggestWhatsappStep({ ...sent, last_whatsapp_at: daysAgo(4) }, NOW)).toMatchObject({ step: "seguimiento", wait: false });
    expect(suggestWhatsappStep({ ...sent, whatsapp_attempts: 2, last_whatsapp_at: daysAgo(9) }, NOW).wait).toBe(true);
  });

  it("sends the link once they reply", () => {
    expect(suggestWhatsappStep({ ...base, stage: "conversando", phone_status: "respondio", whatsapp_attempts: 1 }, NOW).step).toBe("si");
  });

  it("suggests nothing for dead numbers, opt-outs and registered businesses", () => {
    expect(suggestWhatsappStep({ ...base, phone_status: "sin_whatsapp" }, NOW).step).toBeNull();
    expect(suggestWhatsappStep({ ...base, phone_status: "equivocado" }, NOW).step).toBeNull();
    expect(suggestWhatsappStep({ ...base, stage: "descartado" }, NOW).step).toBeNull();
    expect(suggestWhatsappStep({ ...base, stage: "registrado" }, NOW).step).toBeNull();
    expect(suggestWhatsappStep({ ...base, phone_e164: null }, NOW).step).toBeNull();
  });
});
