import { describe, expect, it } from "vitest";
import {
  canShareStudioAd,
  reusableStudioVersion,
  studioAdStateOf,
  studioGroupMessage,
  studioSharedAgo,
  toggleStudioPick,
} from "./adState";
import type { StudioDesignDetail } from "../interfaces/studio";

function detail(
  overrides: {
    stale?: boolean;
    status?: "draft" | "ready" | "archived";
    updatedAt?: string;
    versionAt?: string;
    versionHash?: string;
  } = {},
) {
  return {
    stale: overrides.stale ?? false,
    design: {
      id: "d1",
      status: overrides.status ?? "ready",
      active_version_id: "v1",
      source_hash: "h1",
      updated_at: overrides.updatedAt ?? "2026-11-27T10:00:00Z",
    },
    versions: [
      {
        id: "v1",
        source_hash: overrides.versionHash ?? "h1",
        created_at: overrides.versionAt ?? "2026-11-27T10:00:05Z",
      },
    ],
  } as unknown as Pick<StudioDesignDetail, "design" | "versions" | "stale">;
}

describe("reusableStudioVersion", () => {
  it("reuses the version made after the last edit", () => {
    expect(reusableStudioVersion(detail())?.id).toBe("v1");
  });
  it("prepares again once the ad was edited after its version", () => {
    expect(
      reusableStudioVersion(detail({ updatedAt: "2026-11-27T11:00:00Z" })),
    ).toBeNull();
  });
  it("never reuses when the product changed or the ad is unfinished", () => {
    expect(reusableStudioVersion(detail({ stale: true }))).toBeNull();
    expect(reusableStudioVersion(detail({ versionHash: "old" }))).toBeNull();
    expect(reusableStudioVersion(detail({ status: "draft" }))).toBeNull();
  });
});

describe("studioSharedAgo", () => {
  const now = new Date(2026, 10, 27, 18);
  it("speaks in days", () => {
    expect(studioSharedAgo(new Date(2026, 10, 27, 9).toISOString(), now)).toBe(
      "hoy",
    );
    expect(studioSharedAgo(new Date(2026, 10, 26, 23).toISOString(), now)).toBe(
      "ayer",
    );
    expect(studioSharedAgo(new Date(2026, 10, 20).toISOString(), now)).toBe(
      "hace 7 días",
    );
    expect(studioSharedAgo(new Date(2026, 8, 20).toISOString(), now)).toBe(
      "hace 2 meses",
    );
  });
});

describe("ad states and group shares", () => {
  const live = new Set(["a"]),
    updating = new Set(["b"]);
  it("puts an ad being redrawn before anything else", () => {
    expect(studioAdStateOf({ id: "b", status: "ready" }, live, updating)).toBe(
      "updating",
    );
    expect(studioAdStateOf({ id: "a", status: "ready" }, live, updating)).toBe(
      "live",
    );
    expect(studioAdStateOf({ id: "c", status: "ready" }, live, updating)).toBe(
      "ready",
    );
    expect(studioAdStateOf({ id: "c", status: "draft" }, live, updating)).toBe(
      "unfinished",
    );
  });
  it("only shares finished ads with a current price", () => {
    expect(canShareStudioAd("live")).toBe(true);
    expect(canShareStudioAd("ready")).toBe(true);
    expect(canShareStudioAd("unfinished")).toBe(false);
    expect(canShareStudioAd("updating")).toBe(false);
  });
  it("picks up to the limit and lets go", () => {
    const full = Array.from({ length: 10 }, (_, i) => `x${i}`);
    expect(toggleStudioPick(full, "y")).toEqual(full);
    expect(toggleStudioPick(full, "x3")).toHaveLength(9);
    expect(toggleStudioPick([], "y")).toEqual(["y"]);
  });
  it("writes one message for the whole group", () => {
    expect(
      studioGroupMessage(
        ["Café del día", "Tarro michelado", "Papas"],
        "https://tlaco.app/sitio/villada",
      ),
    ).toBe(
      "Café del día, Tarro michelado y Papas. Pide en https://tlaco.app/sitio/villada",
    );
    expect(studioGroupMessage(["Café"], "")).toBe("Café.");
  });
});
