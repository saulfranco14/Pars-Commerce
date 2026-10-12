import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MapboxFeature = {
  id: string;
  place_name?: string;
  full_address?: string;
  place_formatted?: string;
  name?: string;
  properties?: { full_address?: string };
  center?: [number, number];
  geometry?: { coordinates?: [number, number] };
};

/**
 * Address lookup stays behind Tlaco's API so the browser never receives the
 * Mapbox secret. `permanent=true` is intentional: a selected result can be
 * retained on the order as its delivery address. Manual capture remains the
 * fallback when the integration is unavailable or finds nothing.
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) return NextResponse.json({ features: [] });

  // Local development historically used MAPBOX_TOKEN while deployments use
  // MAPBOX_ACCESS_TOKEN. Both are server-only values; accepting the former
  // prevents a correctly configured local token from looking like a 503.
  const token = process.env.MAPBOX_ACCESS_TOKEN ?? process.env.MAPBOX_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        features: [],
        unavailable: true,
        message:
          "La búsqueda de mapa no está configurada. Captura la dirección manualmente.",
      },
      { status: 503 },
    );
  }

  const endpoint = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("access_token", token);
  endpoint.searchParams.set("country", "mx");
  endpoint.searchParams.set(
    "types",
    "address,street,place,locality,neighborhood",
  );
  endpoint.searchParams.set("language", "es");
  endpoint.searchParams.set("limit", "5");
  endpoint.searchParams.set("permanent", "true");

  try {
    const response = await fetch(endpoint, { next: { revalidate: 0 } });
    if (!response.ok) {
      return NextResponse.json(
        { features: [], unavailable: true },
        { status: 502 },
      );
    }
    const body = (await response.json()) as { features?: MapboxFeature[] };
    return NextResponse.json({
      features: (body.features ?? []).map((feature) => {
        const coordinates = feature.geometry?.coordinates ?? feature.center;
        const label =
          feature.properties?.full_address ??
          feature.full_address ??
          feature.place_name ??
          [feature.name, feature.place_formatted].filter(Boolean).join(", ");
        return {
          id: feature.id,
          label,
          longitude: coordinates?.[0] ?? null,
          latitude: coordinates?.[1] ?? null,
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { features: [], unavailable: true },
      { status: 502 },
    );
  }
}
