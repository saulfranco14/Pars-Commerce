import { describe, it, expect } from "vitest";

import { deriveFulfillment } from "@/features/qr/helpers/deriveFulfillment";

describe("deriveFulfillment", () => {
  it("todo listo solo cuando cada producto está listo", () => {
    expect(deriveFulfillment(["ready", "ready"])).toBe("ready");
    expect(deriveFulfillment(["ready", "received"])).toBe("in_progress");
  });

  it("en proceso en cuanto uno avanza; recibido si nadie empezó", () => {
    expect(deriveFulfillment(["in_progress", "received"])).toBe("in_progress");
    expect(deriveFulfillment(["received", "received"])).toBe("received");
  });

  it("sin productos no decide nada", () => {
    expect(deriveFulfillment([])).toBeNull();
  });
});
