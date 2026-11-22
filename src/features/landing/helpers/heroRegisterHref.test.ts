import { describe, expect, it } from "vitest";

import { HERO_SCENES } from "@/features/landing/constants/heroScenes";
import { heroRegisterHref } from "@/features/landing/helpers/heroRegisterHref";
import { parseRegistrationIntent } from "@/features/auth/registrationIntent";
import { getSolutionByVertical } from "@/features/solutions/solutionCatalog";

describe("heroRegisterHref", () => {
  it("keeps the plain signup when the scene was only rotating", () => {
    expect(heroRegisterHref({ index: 1, fromCampaign: false })).toBe("/registro");
  });

  it("every hero scene maps to an existing solution", () => {
    for (const scene of HERO_SCENES) expect(getSolutionByVertical(scene.key)).toBeDefined();
  });

  it("sends campaign visitors to signup with their business type and starter catalog", () => {
    const index = HERO_SCENES.findIndex((scene) => scene.key === "autolavado");
    const href = heroRegisterHref({ index, fromCampaign: true });
    const solution = getSolutionByVertical("autolavado")!;
    const intent = parseRegistrationIntent(new URLSearchParams(href.split("?")[1]));
    expect(href.startsWith("/registro?")).toBe(true);
    expect(intent).toMatchObject({
      plan: "free",
      giro: solution.catalog.businessType,
      solutionKey: "autolavado",
      catalogKey: solution.catalog.key,
    });
  });
});
