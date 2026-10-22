"use client";

import { useEffect, useRef, useState } from "react";

import type { PlaceOption } from "@/types/places";

const DEBOUNCE_MS = 320;

function newSessionToken(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

/**
 * Debounced address search shared by checkout and pickup points. One session
 * token covers the typing of one address and is closed by `pick`, so Google
 * bills a single lookup per chosen address instead of every keystroke.
 */
export function usePlaceSearch(initialQuery: string) {
  const [query, setQuery] = useState(initialQuery);
  const [places, setPlaces] = useState<PlaceOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const skipNextSearch = useRef(false);
  const session = useRef(newSessionToken());

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      setPlaces([]);
      setSearching(false);
      return;
    }
    if (query.trim().length < 3) {
      setPlaces([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query, session: session.current });
        const response = await fetch(`/api/public/places?${params}`, { signal: controller.signal });
        const body = (await response.json()) as { features?: PlaceOption[]; unavailable?: boolean };
        setPlaces(body.features ?? []);
        setUnavailable(Boolean(body.unavailable));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setPlaces([]);
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  /** Shows the picked label right away and resolves its coordinates when the provider needs it. */
  async function pick(place: PlaceOption): Promise<PlaceOption> {
    skipNextSearch.current = true;
    setQuery(place.label);
    setPlaces([]);
    const token = session.current;
    session.current = newSessionToken();
    if (place.latitude !== null && place.longitude !== null) return place;
    try {
      const params = new URLSearchParams({ id: place.id, session: token });
      const response = await fetch(`/api/public/places/details?${params}`);
      const body = (await response.json()) as { place?: PlaceOption | null };
      return body.place ? { ...body.place, label: place.label } : place;
    } catch {
      return place;
    }
  }

  return { query, setQuery, places, searching, unavailable, pick };
}
