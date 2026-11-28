import { describe, expect, it } from "vitest";

import { isRejection, parseReplyAnalysis, priceIn } from "@/features/growth/helpers/replyAssist";

describe("priceIn", () => {
  it("finds the price however it is written", () => {
    expect(priceIn("A 20 joven, y el de olla a 25")).toBe("20");
    expect(priceIn("lo doy en $1,250")).toBe("1250");
    expect(priceIn("son 35 pesos")).toBe("35");
    expect(priceIn("gracias, lo veo")).toBeNull();
  });
});

describe("isRejection", () => {
  it("catches a no, even a rude one", () => {
    expect(isRejection("No me interesa, gracias")).toBe(true);
    expect(isRejection("ya no me escriba")).toBe(true);
    expect(isRejection("a 25 el de olla")).toBe(false);
  });
});

describe("parseReplyAnalysis", () => {
  it("reads the model's JSON inside fences", () => {
    expect(parseReplyAnalysis('```json\n{"intent":"precio","price":25,"reply":"¡Gracias!"}\n```')).toEqual({ intent: "precio", price: "25", reply: "¡Gracias!" });
  });

  it("refuses unknown intents or an empty reply", () => {
    expect(parseReplyAnalysis('{"intent":"venta","reply":"x"}')).toBeNull();
    expect(parseReplyAnalysis('{"intent":"duda","reply":""}')).toBeNull();
    expect(parseReplyAnalysis("no json")).toBeNull();
  });
});
