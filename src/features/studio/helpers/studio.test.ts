import { describe, expect, it } from "vitest";
import {
  studioRegistrationMetadata,
  parseRegistrationIntent,
  registrationIntentQuery,
} from "@/features/auth/registrationIntent";
import { isStudioMembershipActive, validStudioDestination } from "./access";
import { studioEntryHref, studioLoginRegistrationHref } from "./entry";
import {
  applyStudioFinding,
  bindStudioScene,
  createStudioScene,
  reflowStudioScene,
  reviewStudioScene,
} from "./scene";
import { studioSceneSchema } from "../validations/studioSchemas";
import type { StudioMembership, StudioSource } from "../interfaces/studio";

const source: StudioSource = {
  type: "promotion",
  id: "10000000-0000-4000-8000-000000000001",
  name: "Paquete de despensa",
  description: "",
  conditions: "Compra mínima $100.00",
  price: 150,
  priceLabel: "$150.00",
  badge: "Paquete en $150.00",
  period: "",
  imageUrls: ["https://example.com/product.png"],
  logoUrl: "https://example.com/logo.png",
  destinationUrl: "https://tlaco.app/sitio/tienda",
  status: "active",
  validFrom: null,
  validUntil: "2026-12-01T06:00:00Z",
  channels: ["public_store", "onsite"],
  isPublic: true,
  commercialHash: "original",
  items: [],
};
const membership: StudioMembership = {
  id: "subscription",
  tenant_id: "tenant",
  plan_code: "basic",
  status: "active",
  current_period_start: "2026-11-01T00:00:00Z",
  current_period_end: "2026-12-01T00:00:00Z",
  cancel_at_period_end: false,
  pending_plan_code: null,
  ai_blocked: false,
};

describe("Studio membership and acquisition", () => {
  it("keeps the paid period after cancellation and closes access at its exact end", () => {
    expect(
      isStudioMembershipActive(
        { ...membership, status: "cancelling" },
        new Date("2026-11-30T23:59:59Z"),
      ),
    ).toBe(true);
    expect(
      isStudioMembershipActive(
        membership,
        new Date(membership.current_period_end!),
      ),
    ).toBe(false);
    expect(
      isStudioMembershipActive(
        { ...membership, status: "pending_payment" },
        new Date("2026-11-15"),
      ),
    ).toBe(false);
    expect(isStudioMembershipActive(null)).toBe(false);
    expect(
      isStudioMembershipActive(membership, new Date("2026-10-31T23:59:59Z")),
    ).toBe(false);
  });
  it("keeps Studio distinct from the operational plan through a registration round trip", () => {
    const next = studioEntryHref("pro"),
      registration = studioLoginRegistrationHref(next);
    const parsed = parseRegistrationIntent(
      new URL(registration, "https://tlaco.app").searchParams,
    );
    expect(parsed).toMatchObject({
      entryProduct: "studio",
      studioPlan: "pro",
      studioAction: "create",
      plan: "free",
    });
    expect(
      parseRegistrationIntent(
        new URLSearchParams(registrationIntentQuery(parsed)),
      ),
    ).toEqual(parsed);
    expect(studioEntryHref("untrusted")).not.toContain("studio_plan");
  });
  it("validates optional Studio metadata from either registration or a stored intent", () => {
    expect(
      studioRegistrationMetadata({
        entry_product: "studio",
        studio_plan: "unpublished",
        studio_action: "other",
        entry_origin: "email@example.com",
      }),
    ).toEqual({
      entry_product: "studio",
      studio_plan: null,
      studio_action: "create",
      entry_origin: "studio",
    });
    expect(
      studioRegistrationMetadata({
        entryProduct: "studio",
        studioPlan: "pro",
        studioAction: "home",
        entryOrigin: "solution:tienda",
      }),
    ).toMatchObject({
      studio_plan: "pro",
      studio_action: "home",
      entry_origin: "solution:tienda",
    });
    expect(studioRegistrationMetadata({ entryProduct: "other" })).toEqual({});
  });
  it("rejects scripts, credentials and non-HTTPS campaign destinations", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://example.com",
      "https://name:secret@example.com",
      "/dashboard",
    ])
      expect(validStudioDestination(url)).toBe(false);
    expect(
      validStudioDestination("https://example.com/promocion?origen=qr"),
    ).toBe(true);
    expect(validStudioDestination("")).toBe(true);
  });
});

describe("Studio compositions", () => {
  it("keeps commercial content bound while retaining visual edits", () => {
    const scene = createStudioScene(source),
      price = scene.nodes.find((n) => n.binding === "price")!;
    price.content = "$1.00";
    price.x = 0.3;
    price.fontSize = 0.12;
    const bound = bindStudioScene(scene, { ...source, priceLabel: "$175.00" });
    expect(bound.nodes.find((n) => n.id === price.id)).toMatchObject({
      content: "$175.00",
      x: 0.3,
      fontSize: 0.12,
    });
    expect(scene.nodes.find((n) => n.binding === "conditions")?.content).toBe(
      source.conditions,
    );
  });
  it("moves the image beside the copy for banners and preserves assets and stable layer IDs", () => {
    const scene = createStudioScene(source),
      banner = reflowStudioScene(scene, "banner");
    expect(banner.nodes.map((n) => n.id)).toEqual(scene.nodes.map((n) => n.id));
    expect(banner.nodes.find((n) => n.kind === "image")).toMatchObject({
      x: 0.52,
      width: 0.42,
      imageUrl: source.imageUrls[0],
    });
    expect(banner.nodes.find((n) => n.kind === "logo")?.width).toBeLessThan(
      0.2,
    );
    expect(studioSceneSchema.safeParse(banner).success).toBe(true);
  });
  it("can correct a safe-area problem without modifying the original scene", () => {
    const scene = createStudioScene(source);
    scene.nodes[0].x = 1.1;
    const finding = reviewStudioScene(scene).find(
      (f) => f.code === "OUTSIDE_SAFE_AREA",
    )!;
    const fixed = applyStudioFinding(scene, finding),
      node = fixed.nodes.find((n) => n.id === finding.nodeId)!;
    expect(node.x + node.width).toBeLessThanOrEqual(0.96);
    expect(scene.nodes[0].x).toBe(1.1);
  });
  it("flags clipping and rejects duplicated node IDs and arbitrary style properties", () => {
    const scene = createStudioScene(source),
      price = scene.nodes.find((n) => n.binding === "price")!;
    price.width = 0.03;
    price.height = 0.01;
    expect(
      reviewStudioScene(scene).some(
        (f) => f.nodeId === price.id && f.code === "TEXT_MAY_CLIP",
      ),
    ).toBe(true);
    expect(
      studioSceneSchema.safeParse({
        ...scene,
        nodes: [...scene.nodes, scene.nodes[0]],
      }).success,
    ).toBe(false);
    expect(
      studioSceneSchema.safeParse({
        ...scene,
        nodes: [{ ...price, html: "<script>" }],
      }).success,
    ).toBe(false);
  });
});
