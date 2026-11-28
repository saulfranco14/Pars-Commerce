import { describe, expect, it } from "vitest";
import { studioShelfAds } from "./shelf";
import { studioBackHref } from "./entry";
import { studioBuildEnv } from "../constants/qaEnvironment";
import type { StudioScene } from "../interfaces/scene";

const scene = {} as StudioScene;
const design = (
  id: string,
  source_id: string | null,
  status: "draft" | "ready" | "archived",
  updated_at: string,
) => ({ id, source_id, status, updated_at, draft_scene: scene });
const placement = (
  design_id: string,
  created_at: string,
  is_active: boolean,
  disabled_reason: string | null = null,
  surface = "product_campaign",
) => ({ design_id, surface, is_active, disabled_reason, created_at });

describe("Studio shelf ads", () => {
  it("keeps the newest ad of each item and skips archived ones", () => {
    const ads = studioShelfAds(
      [
        design("old", "p1", "ready", "2026-11-01T00:00:00Z"),
        design("new", "p1", "draft", "2026-11-20T00:00:00Z"),
        design("gone", "p2", "archived", "2026-11-25T00:00:00Z"),
        design("free", null, "ready", "2026-11-25T00:00:00Z"),
      ],
      [],
    );
    expect(ads.get("p1")).toMatchObject({
      designId: "new",
      state: "unfinished",
    });
    expect(ads.has("p2")).toBe(false);
    expect(ads.size).toBe(1);
  });

  it("reads where the ad stands from its newest placement per place", () => {
    const ads = studioShelfAds(
      [
        design("live", "p1", "ready", "2026-11-20T00:00:00Z"),
        design("retired", "p2", "ready", "2026-11-20T00:00:00Z"),
        design("redraw", "p3", "ready", "2026-11-20T00:00:00Z"),
      ],
      [
        placement("live", "2026-11-21T00:00:00Z", true),
        placement("retired", "2026-11-21T00:00:00Z", true),
        placement("retired", "2026-11-22T00:00:00Z", false, "manual"),
        placement("redraw", "2026-11-22T00:00:00Z", false, "source_changed"),
      ],
    );
    expect(ads.get("p1")?.state).toBe("live");
    expect(ads.get("p2")?.state).toBe("ready");
    expect(ads.get("p3")?.state).toBe("updating");
  });
});

describe("Studio back arrow", () => {
  it("returns to the list the ad was opened from", () => {
    expect(studioBackHref("luna", true)).toBe("/dashboard/luna/studio/disenos");
    expect(studioBackHref("luna", false)).toBe("/dashboard/luna/studio");
  });
});

describe("Studio build flags", () => {
  it("opens Studio to every business on QA and production, without recharges in production", () => {
    const qa = studioBuildEnv("qa_release", "preview"),
      prod = studioBuildEnv("master", "production");
    expect(qa.NEXT_PUBLIC_STUDIO_BUSINESS_ENABLED).toBe("true");
    expect(qa.NEXT_PUBLIC_STUDIO_PILOT_TENANT_IDS).toBeUndefined();
    expect(prod).toMatchObject({
      STUDIO_ENABLED: "true",
      STUDIO_AI_ENABLED: "true",
      STUDIO_PUBLISH_ENABLED: "true",
      STUDIO_CHECKOUT_ENABLED: "false",
      STUDIO_PUBLIC_ENABLED: "false",
      NEXT_PUBLIC_STUDIO_BUSINESS_ENABLED: "true",
    });
  });

  it("leaves other previews and local builds alone", () => {
    expect(studioBuildEnv("feature/x", "preview")).toEqual({});
    expect(studioBuildEnv(undefined, undefined)).toEqual({});
  });
});
