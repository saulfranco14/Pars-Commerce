import { describe, expect, it } from "vitest";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { leadLastTouch, timeAgo } from "@/features/growth/helpers/leadLastTouch";

describe("formatBusinessName", () => {
  it("tames names written in caps", () => {
    expect(formatBusinessName("ACABADOS CERAMICOS")).toBe("Acabados Ceramicos");
    expect(formatBusinessName("FERRETERÍA LA ESPERANZA DEL VALLE")).toBe("Ferretería La Esperanza del Valle");
    expect(formatBusinessName("AL-SAN")).toBe("Al-San");
  });

  it("lowers connectors but keeps the owner's own casing", () => {
    expect(formatBusinessName("Aluminio Y Vidrio Cel")).toBe("Aluminio y Vidrio Cel");
    expect(formatBusinessName("McDonald's De Neza")).toBe("McDonald's de Neza");
    expect(formatBusinessName("La Esquina")).toBe("La Esquina");
  });

  it("leaves codes alone", () => {
    expect(formatBusinessName("FARMACIA 24HRS")).toBe("Farmacia 24HRS");
    expect(formatBusinessName("  ABARROTES   S.A.  ")).toBe("Abarrotes S.A.");
  });
});

describe("leadLastTouch", () => {
  const now = new Date("2026-10-28T18:00:00Z");
  const base = { phone_status: "desconocido", email_status: "desconocido", whatsapp_attempts: 0, last_whatsapp_at: null, para_viewed_at: null } as const;

  it("is empty for an untouched prospect", () => {
    expect(leadLastTouch(base, now)).toBeNull();
  });

  it("puts an opened store first", () => {
    const touch = leadLastTouch({ ...base, phone_status: "enviado", whatsapp_attempts: 1, last_whatsapp_at: "2026-10-28T10:00:00Z", para_viewed_at: "2026-10-28T17:30:00Z" }, now);
    expect(touch).toEqual({ label: "Abrió su tienda hace 30 min", tone: "warning" });
  });

  it("tells a first message from a follow-up", () => {
    expect(leadLastTouch({ ...base, phone_status: "enviado", whatsapp_attempts: 1, last_whatsapp_at: "2026-10-28T16:00:00Z" }, now)?.label).toBe("WhatsApp enviado hace 2 h");
    expect(leadLastTouch({ ...base, phone_status: "enviado", whatsapp_attempts: 2, last_whatsapp_at: "2026-10-27T16:00:00Z" }, now)?.label).toBe("Seguimiento enviado ayer");
  });

  it("flags numbers that don't work", () => {
    expect(leadLastTouch({ ...base, phone_status: "sin_whatsapp" }, now)?.label).toBe("Sin WhatsApp");
    expect(leadLastTouch({ ...base, phone_status: "equivocado" }, now)?.tone).toBe("danger");
  });

  it("counts days after the first one", () => {
    expect(timeAgo("2026-10-24T18:00:00Z", now)).toBe("hace 4 días");
  });
});
