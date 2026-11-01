import { describe, expect, it } from "vitest";

import { questionKey } from "@/features/growth/helpers/questionKey";

describe("questionKey", () => {
  it("treats the same doubt written differently as one", () => {
    const key = questionKey("cobran comision tlaco");
    expect(questionKey("¿Tlaco cobra comisión?")).toBe(key);
    expect(questionKey("Comisiones que cobran")).toBe(key);
  });

  it("ignores accents, punctuation, filler words and order", () => {
    expect(questionKey("¿Le cobran por los meses sin intereses?")).toBe(questionKey("meses intereses cobran"));
  });

  it("keeps different doubts apart", () => {
    expect(questionKey("¿Necesita terminal?")).not.toBe(questionKey("¿Cobran comisión?"));
  });
});
