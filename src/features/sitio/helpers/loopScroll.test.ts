import { describe, expect, it } from "vitest";

import { alignLoopScrollForStep, centeredScrollLeft, wrapLoopScroll } from "@/features/sitio/helpers/loopScroll";

const ORIGIN = 16;
const SET = 1000;

describe("wrapLoopScroll", () => {
  it("leaves positions inside the middle copy alone", () => {
    expect(wrapLoopScroll(ORIGIN + 1000, ORIGIN, SET)).toBe(ORIGIN + 1000);
  });

  it("jumps forward one copy when the user nears the start", () => {
    expect(wrapLoopScroll(ORIGIN + 300, ORIGIN, SET)).toBe(ORIGIN + 1300);
  });

  it("jumps back one copy when the user nears the end", () => {
    expect(wrapLoopScroll(ORIGIN + 1700, ORIGIN, SET)).toBe(ORIGIN + 700);
  });
});

describe("alignLoopScrollForStep", () => {
  it.each([600, -600, 300, -300])("keeps a %ipx step within the three copies", (delta) => {
    for (const left of [ORIGIN + 520, ORIGIN + 1000, ORIGIN + 1480]) {
      const start = alignLoopScrollForStep(left, ORIGIN, SET, delta);
      expect(Math.abs(start - left) % SET).toBe(0);
      for (const point of [start, start + delta]) {
        expect(point - ORIGIN).toBeGreaterThanOrEqual(0);
        expect(point - ORIGIN).toBeLessThan(SET * 2);
      }
    }
  });
});

describe("centeredScrollLeft", () => {
  it("centers the item in the viewport", () => {
    expect(centeredScrollLeft(500, 100, 400)).toBe(350);
  });

  it("never scrolls before the start", () => {
    expect(centeredScrollLeft(20, 100, 400)).toBe(0);
  });
});
