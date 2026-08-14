import type { MetadataRoute } from "next";

import { SOLUTIONS } from "@/features/solutions/solutionCatalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tlaco.mx").replace(/\/$/, "");
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
