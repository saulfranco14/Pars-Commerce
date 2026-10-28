import { describe, expect, it } from "vitest";

import { normalizeTemplateDraft } from "@/features/growth/validations/templateDraft";

describe("normalizeTemplateDraft", () => {
  it("accepts a valid editor payload", () => {
    expect(normalizeTemplateDraft({ channel: "email", step: "d0", variant: "B", giro: "materiales", subject: "Hola", body: "Cuerpo del correo" })).toEqual({
      channel: "email", step: "d0", variant: "B", giro: "materiales", subject: "Hola", body: "Cuerpo del correo",
    });
  });

  it("rejects steps from another channel, unknown giros and bad shapes", () => {
    expect(normalizeTemplateDraft({ channel: "whatsapp", step: "d0", variant: "A", body: "x" })).toBeNull();
    expect(normalizeTemplateDraft({ channel: "whatsapp", step: "m1", variant: "A", giro: "taller", body: "x" })).toBeNull();
    expect(normalizeTemplateDraft({ channel: "sms", step: "m1", variant: "A", body: "x" })).toBeNull();
    expect(normalizeTemplateDraft(null)).toBeNull();
  });

  it("treats an empty giro as the generic version", () => {
    expect(normalizeTemplateDraft({ channel: "whatsapp", step: "m1", variant: "A", giro: "", body: "Hola {negocio}" })?.giro).toBeNull();
  });
});
