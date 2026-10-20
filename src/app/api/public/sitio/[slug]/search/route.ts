import { NextResponse } from "next/server";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { searchStoreCatalog } from "@/features/sitio/services/storefrontSearchService";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const query = new URL(request.url).searchParams.get("q") ?? "";

  const result = await searchStoreCatalog(slug, query);
  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json(
    { results: result.data },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
  );
}
