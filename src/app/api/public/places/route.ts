import { NextResponse } from "next/server";

import { searchPlaces } from "@/lib/places/placesProvider";

export const runtime = "nodejs";

/**
 * Address suggestions for checkout and pickup points. The browser sends a
 * session token per search so Google bills one lookup per chosen address.
 * Manual capture remains the fallback when the integration is unavailable.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim().slice(0, 120) ?? "";
  if (query.length < 3) return NextResponse.json({ features: [] });

  const result = await searchPlaces(query, params.get("session"));
  if (!result.ok) {
    return NextResponse.json({ features: [], unavailable: true, message: result.message }, { status: result.status });
  }
  return NextResponse.json({ features: result.features });
}
