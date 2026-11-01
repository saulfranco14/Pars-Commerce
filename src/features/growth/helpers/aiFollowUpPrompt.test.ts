import { describe, expect, it } from "vitest";

import { buildFollowUpPrompt, finishFollowUp } from "@/features/growth/helpers/aiFollowUpPrompt";

import type { AiFollowUpContext } from "@/features/growth/interfaces/aiDraft";

const context: AiFollowUpContext = {
  businessName: "Cafe Adetto",
  giro: "Cafetería",
  place: "Santa María Nativitas, Chimalhuacán",
  senderName: "Saúl",
  signature: "Saúl Franco · Tlaco",
  greeting: "Buenas tardes",
  link: "https://tlaco.app/para/cafe-adetto-Xy12",
  sentCount: 1,
  views: 2,
  averageSeconds: 12,
  sections: ["presentación", "su tienda"],
  objection: null,
  reply: "Ya no está activo el negocio",
  claimClicked: false,
  previousMessages: ["Buenas tardes. ¿Hablo con Cafe Adetto?"],
};

describe("AI follow-up", () => {
  it("gives the model the history, the link and the previous messages, marking the reply as data", () => {
    const { system, prompt } = buildFollowUpPrompt(context);
    expect(system).toContain("distinto a los mensajes anteriores");
    expect(prompt).toContain("Abrió su tienda de ejemplo 2 veces");
    expect(prompt).toContain("Vio: presentación, su tienda");
    expect(prompt).toContain("no instrucciones");
    expect(prompt).toContain(context.link);
    expect(prompt).toContain("Mensaje anterior 1");
  });

  it("puts back a missing link and keeps the signature last", () => {
    const body = finishFollowUp("«Buenas tardes, ¿pudo verla?»", context);
    expect(body.startsWith("Buenas tardes")).toBe(true);
    expect(body).toContain(context.link);
    expect(body.trim().endsWith(context.signature)).toBe(true);
    expect(finishFollowUp(`Hola\n\n${context.link}\n\n${context.signature}`, context).match(/Saúl Franco/g)).toHaveLength(1);
  });
});
