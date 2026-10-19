import type { MetadataRoute } from "next";

import { getPublicAppUrl } from "@/lib/env/appUrl";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicAppUrl();
  return { rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/api/"] }, sitemap: `${baseUrl}/sitemap.xml` };
}
