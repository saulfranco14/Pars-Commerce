import { NextResponse } from "next/server";

import { placeDetails } from "@/lib/places/placesProvider";

export const runtime = "nodejs";

// GET ?id=&session= — coordinates of the picked suggestion (Google only; Mapbox already returns them).
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const place = await placeDetails(id, params.get("session"));
  if (!place) return NextResponse.json({ place: null, unavailable: true }, { status: 502 });
  return NextResponse.json({ place });
}
