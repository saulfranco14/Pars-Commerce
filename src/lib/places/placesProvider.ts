/**
 * Address search behind Tlaco's API so no key reaches the browser.
 * Google Places (New) when GOOGLE_MAPS_API_KEY is set: autocomplete with a
 * session token is free and only the final Place Details is billed (10,000
 * free per month). Mapbox stays as the fallback while the key is not set.
 */

export interface PlaceResult {
  id: string;
  label: string;
  /** Null for Google suggestions until the chosen one is resolved with details. */
  latitude: number | null;
  longitude: number | null;
}

export type PlacesSearch = { ok: true; features: PlaceResult[] } | { ok: false; status: 502 | 503; message?: string };

const GOOGLE_AUTOCOMPLETE = "https://places.googleapis.com/v1/places:autocomplete";
const GOOGLE_DETAILS = "https://places.googleapis.com/v1/places/";
const MAPBOX_FORWARD = "https://api.mapbox.com/search/geocode/v6/forward";

export function placesProvider(): "google" | "mapbox" | null {
  if (process.env.GOOGLE_MAPS_API_KEY) return "google";
  if (process.env.MAPBOX_ACCESS_TOKEN ?? process.env.MAPBOX_TOKEN) return "mapbox";
  return null;
}

async function searchGoogle(query: string, sessionToken: string | null): Promise<PlacesSearch> {
  const response = await fetch(GOOGLE_AUTOCOMPLETE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY as string },
    body: JSON.stringify({
      input: query,
      includedRegionCodes: ["mx"],
      languageCode: "es",
      ...(sessionToken ? { sessionToken } : {}),
    }),
    cache: "no-store",
  });
  if (!response.ok) return { ok: false, status: 502 };
  const body = (await response.json()) as {
    suggestions?: Array<{ placePrediction?: { placeId?: string; text?: { text?: string } } }>;
  };
  const features = (body.suggestions ?? [])
    .map((suggestion) => suggestion.placePrediction)
    .filter((prediction): prediction is { placeId: string; text: { text: string } } => Boolean(prediction?.placeId && prediction.text?.text))
    .slice(0, 5)
    .map((prediction) => ({ id: prediction.placeId, label: prediction.text.text, latitude: null, longitude: null }));
  return { ok: true, features };
}

async function searchMapbox(query: string): Promise<PlacesSearch> {
  const endpoint = new URL(MAPBOX_FORWARD);
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("access_token", (process.env.MAPBOX_ACCESS_TOKEN ?? process.env.MAPBOX_TOKEN) as string);
  endpoint.searchParams.set("country", "mx");
  endpoint.searchParams.set("types", "address,street,place,locality,neighborhood");
  endpoint.searchParams.set("language", "es");
  endpoint.searchParams.set("limit", "5");
  // A chosen result is kept on the order, which Mapbox only allows with permanent geocoding.
  endpoint.searchParams.set("permanent", "true");
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) return { ok: false, status: 502 };
  const body = (await response.json()) as {
    features?: Array<{
      id: string;
      place_name?: string;
      full_address?: string;
      place_formatted?: string;
      name?: string;
      properties?: { full_address?: string };
      center?: [number, number];
      geometry?: { coordinates?: [number, number] };
    }>;
  };
  return {
    ok: true,
    features: (body.features ?? []).map((feature) => {
      const coordinates = feature.geometry?.coordinates ?? feature.center;
      return {
        id: feature.id,
        label:
          feature.properties?.full_address ??
          feature.full_address ??
          feature.place_name ??
          [feature.name, feature.place_formatted].filter(Boolean).join(", "),
        longitude: coordinates?.[0] ?? null,
        latitude: coordinates?.[1] ?? null,
      };
    }),
  };
}

export async function searchPlaces(query: string, sessionToken: string | null): Promise<PlacesSearch> {
  const provider = placesProvider();
  if (!provider) {
    return { ok: false, status: 503, message: "La búsqueda de direcciones no está configurada. Captura la dirección manualmente." };
  }
  try {
    return provider === "google" ? await searchGoogle(query, sessionToken) : await searchMapbox(query);
  } catch {
    return { ok: false, status: 502 };
  }
}

/** Coordinates of the suggestion the person picked; closes the Google session (one billed call). */
export async function placeDetails(placeId: string, sessionToken: string | null): Promise<PlaceResult | null> {
  if (placesProvider() !== "google") return null;
  const url = new URL(`${GOOGLE_DETAILS}${encodeURIComponent(placeId)}`);
  url.searchParams.set("languageCode", "es");
  if (sessionToken) url.searchParams.set("sessionToken", sessionToken);
  try {
    const response = await fetch(url, {
      headers: { "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY as string, "X-Goog-FieldMask": "id,formattedAddress,location" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const place = (await response.json()) as { id?: string; formattedAddress?: string; location?: { latitude?: number; longitude?: number } };
    if (!place.id) return null;
    return {
      id: place.id,
      label: place.formattedAddress ?? "",
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
    };
  } catch {
    return null;
  }
}
