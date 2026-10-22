import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { placeDetails, placesProvider, searchPlaces } from "@/lib/places/placesProvider";

const fetchMock = vi.fn();

function json(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
  vi.stubEnv("MAPBOX_ACCESS_TOKEN", "");
  vi.stubEnv("MAPBOX_TOKEN", "");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  fetchMock.mockReset();
});

describe("placesProvider", () => {
  it("prefers Google, falls back to Mapbox, and says when nothing is configured", async () => {
    expect(placesProvider()).toBeNull();
    expect(await searchPlaces("Av Mexico 211", null)).toMatchObject({ ok: false, status: 503 });
    vi.stubEnv("MAPBOX_ACCESS_TOKEN", "mb");
    expect(placesProvider()).toBe("mapbox");
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "g");
    expect(placesProvider()).toBe("google");
  });
});

describe("Google Places (New)", () => {
  beforeEach(() => vi.stubEnv("GOOGLE_MAPS_API_KEY", "g-key"));

  it("autocompletes in Mexico with the session token and no coordinates yet", async () => {
    fetchMock.mockReturnValueOnce(
      json({ suggestions: [{ placePrediction: { placeId: "p1", text: { text: "Av. México 211, Neza" } } }, { queryPrediction: {} }] }),
    );
    const result = await searchPlaces("Av Mexico 211", "session-1");
    expect(result).toEqual({ ok: true, features: [{ id: "p1", label: "Av. México 211, Neza", latitude: null, longitude: null }] });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places:autocomplete");
    expect(init.headers["X-Goog-Api-Key"]).toBe("g-key");
    expect(JSON.parse(init.body)).toMatchObject({ input: "Av Mexico 211", sessionToken: "session-1", includedRegionCodes: ["mx"] });
  });

  it("resolves the picked place with only the fields it needs, closing the session", async () => {
    fetchMock.mockReturnValueOnce(json({ id: "p1", formattedAddress: "Av. México 211", location: { latitude: 19.4, longitude: -99.0 } }));
    expect(await placeDetails("p1", "session-1")).toEqual({ id: "p1", label: "Av. México 211", latitude: 19.4, longitude: -99.0 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/v1/places/p1");
    expect(String(url)).toContain("sessionToken=session-1");
    expect(init.headers["X-Goog-FieldMask"]).toBe("id,formattedAddress,location");
  });

  it("reports an upstream failure instead of throwing", async () => {
    fetchMock.mockReturnValueOnce(json({}, false));
    expect(await searchPlaces("Av Mexico 211", null)).toEqual({ ok: false, status: 502 });
    fetchMock.mockRejectedValueOnce(new Error("network"));
    expect(await placeDetails("p1", null)).toBeNull();
  });
});

describe("Mapbox fallback", () => {
  it("keeps returning coordinates with the suggestion", async () => {
    vi.stubEnv("MAPBOX_ACCESS_TOKEN", "mb");
    fetchMock.mockReturnValueOnce(json({ features: [{ id: "m1", properties: { full_address: "Calle 1, Centro" }, geometry: { coordinates: [-99.1, 19.5] } }] }));
    expect(await searchPlaces("Calle 1", "ignored")).toEqual({
      ok: true,
      features: [{ id: "m1", label: "Calle 1, Centro", latitude: 19.5, longitude: -99.1 }],
    });
    expect(await placeDetails("m1", null)).toBeNull();
  });
});
