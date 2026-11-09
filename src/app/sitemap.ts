import type { MetadataRoute } from "next";

import { SOLUTIONS } from "@/features/solutions/solutionCatalog";
import { getPublicAppUrl } from "@/lib/env/appUrl";
import { studioFlags } from "@/features/studio/services/studioFlags";
import { STUDIO_CONTENT_UPDATED_AT } from "@/features/studio/constants/studio";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicAppUrl();
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...(studioFlags().public
      ? [
          {
            url: `${baseUrl}/studio`,
            lastModified: new Date(STUDIO_CONTENT_UPDATED_AT),
            changeFrequency: "monthly" as const,
            priority: 0.9,
          },
        ]
      : []),
    ...SOLUTIONS.map((solution) => ({
      url: `${baseUrl}/soluciones/${solution.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
