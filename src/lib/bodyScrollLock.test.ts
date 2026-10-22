import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { lockBodyScroll } from "@/lib/bodyScrollLock";

describe("lockBodyScroll", () => {
  const style = { overflow: "" };

  beforeEach(() => {
    style.overflow = "";
    vi.stubGlobal("document", { body: { style } });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("keeps scroll locked until the last overlay closes, in any order", () => {
    const sheet = lockBodyScroll();
    const dialog = lockBodyScroll();
    expect(style.overflow).toBe("hidden");
    sheet();
    expect(style.overflow).toBe("hidden");
    dialog();
    expect(style.overflow).toBe("");
  });

  it("ignores a second release and clears a lock left stuck by older code", () => {
    style.overflow = "hidden";
    const release = lockBodyScroll();
    release();
    release();
    expect(style.overflow).toBe("");
    const again = lockBodyScroll();
    expect(style.overflow).toBe("hidden");
    again();
    expect(style.overflow).toBe("");
  });
});
