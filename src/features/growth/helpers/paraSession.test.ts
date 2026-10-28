import { describe, expect, it } from "vitest";

import { describeParaSession, formatVisitSeconds, paraEventDetail, paraOutcome, sanitizeParaSession } from "@/features/growth/helpers/paraSession";
import { itemInitials, senderFromSignature } from "@/features/growth/helpers/paraSender";

describe("sanitizeParaSession", () => {
  it("keeps known sections in page order and drops unknown actions", () => {
    const payload = sanitizeParaSession({
      sections: ["cierre", "intro", "admin", "productos"],
      actions: ["claim:bar", "claim:bar", "delete:all", "help:final", 7],
      items: [" Cemento 50 kg ", "Cemento 50 kg", 3, ""],
    });
    expect(payload).toEqual({ sections: ["intro", "productos", "cierre"], actions: ["claim:bar", "help:final"], items: ["Cemento 50 kg"] });
  });

  it("caps product names and how many are reported", () => {
    const payload = sanitizeParaSession({ items: ["x".repeat(200), "a", "b", "c", "d", "e", "f"] });
    expect(payload.items).toHaveLength(5);
    expect(payload.items[0]).toHaveLength(80);
  });

  it("survives garbage", () => {
    expect(sanitizeParaSession("hola")).toEqual({ sections: [], actions: [], items: [] });
    expect(sanitizeParaSession(null)).toEqual({ sections: [], actions: [], items: [] });
  });
});

describe("visit summary", () => {
  it("ranks going to signup above asking for help", () => {
    expect(paraOutcome({ sections: [], actions: ["help:intro", "claim:final"], items: [] })).toBe("claim");
    expect(paraOutcome({ sections: [], actions: ["help:intro"], items: [] })).toBe("help");
    expect(paraOutcome({ sections: ["intro"], actions: [], items: [] })).toBe("left");
  });

  it("says when only the first screen was seen", () => {
    expect(describeParaSession({ sections: ["intro"], actions: [], items: [] })).toEqual({ seen: "sólo presentación", tapped: null });
  });

  it("lists buttons with where they were and then products", () => {
    const { seen, tapped } = describeParaSession({ sections: ["intro", "productos"], actions: ["claim:bar"], items: ["Gringa"] });
    expect(seen).toBe("presentación, productos");
    expect(tapped).toBe("Activar (arriba), Gringa");
  });

  it("formats the time on the page", () => {
    expect(formatVisitSeconds(7.4)).toBe("7 s");
    expect(formatVisitSeconds(125)).toBe("2 min 5 s");
    expect(formatVisitSeconds(120)).toBe("2 min");
  });

  it("adds detail only to «Para ti» events in the timeline", () => {
    expect(paraEventDetail("claim_clicked", { placement: "final" })).toBe(" · al final");
    expect(paraEventDetail("para_left", { sections: ["intro", "tienda"], actions: [], items: [] })).toBe(" · vio presentación, su tienda");
    expect(paraEventDetail("email_sent", { placement: "final" })).toBe("");
  });
});

describe("senderFromSignature", () => {
  it("takes the person from the signature", () => {
    expect(senderFromSignature("Saúl Franco · Tlaco")).toEqual({ name: "Saúl Franco", firstName: "Saúl", initial: "S" });
    expect(senderFromSignature("Ana | Tlaco")?.name).toBe("Ana");
  });

  it("has no sender when the signature is only the brand", () => {
    expect(senderFromSignature("Tlaco")).toBeNull();
    expect(senderFromSignature("")).toBeNull();
    expect(senderFromSignature(null)).toBeNull();
  });
});

describe("itemInitials", () => {
  it("skips short words and numbers", () => {
    expect(itemInitials("Taco al pastor")).toBe("TP");
    expect(itemInitials("Cemento 50 kg")).toBe("CE");
    expect(itemInitials("Block hueco")).toBe("BH");
    expect(itemInitials("Varilla 3/8")).toBe("VA");
  });
});
