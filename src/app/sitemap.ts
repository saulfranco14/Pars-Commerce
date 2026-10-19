import type { MetadataRoute } from "next";

import { SOLUTIONS } from "@/features/solutions/solutionCatalog";
import { getPublicAppUrl } from "@/lib/env/appUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicAppUrl();
  const now = new Date();
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...SOLUTIONS.map((solution) => ({
      url: `${baseUrl}/soluciones/${solution.path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
