import { registrationIntentQuery } from "@/features/auth/registrationIntent";
import { getSolutionByVertical } from "@/features/solutions/solutionCatalog";
import { HERO_SCENES } from "@/features/landing/constants/heroScenes";

import type { HeroSceneSelection } from "@/features/landing/interfaces/heroScene";

/**
 * A visitor who came from a business-type ad signs up with that business's
 * starter catalog, like the `/soluciones` flow. Rotating scenes say nothing
 * about the visitor, so they get the plain signup.
 */
export function heroRegisterHref(selection: HeroSceneSelection): string {
  if (!selection.fromCampaign) return "/registro";
  const solution = getSolutionByVertical(HERO_SCENES[selection.index].key);
  if (!solution) return "/registro";
  return `/registro?${registrationIntentQuery({
    plan: "free",
    giro: solution.catalog.businessType,
    solutionKey: solution.path,
    catalogKey: solution.catalog.key,
  })}`;
}
