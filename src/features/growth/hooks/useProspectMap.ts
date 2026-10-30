import { useEffect, useState } from "react";
import useSWR from "swr";

import { fetchNearby, mapKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { NearbyLead } from "@/features/growth/interfaces/lead";
import type { MapBounds, MapResult } from "@/features/growth/interfaces/map";

/** The east of the State of Mexico, where the first prospects live. */
export const INITIAL_BOUNDS: MapBounds = { minLat: 19.28, minLng: -99.11, maxLat: 19.66, maxLng: -98.66 };

/** Points for the visible box (debounced while panning) and «Ruta de hoy» from the person's location. */
export function useProspectMap(filters: { giro?: string; owner?: string }) {
  const [bounds, setBounds] = useState<MapBounds>(INITIAL_BOUNDS);
  const [settled, setSettled] = useState<MapBounds>(INITIAL_BOUNDS);
  const [route, setRoute] = useState<NearbyLead[]>([]);
  const [routeState, setRouteState] = useState<"idle" | "locating" | "error">("idle");
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(bounds), 400);
    return () => clearTimeout(timer);
  }, [bounds]);

  const { data, isLoading } = useSWR<MapResult>(mapKey({ ...settled, ...filters }), swrFetcher, { keepPreviousData: true });

  function planRoute() {
    if (!("geolocation" in navigator)) {
      setRouteState("error");
      setRouteError("Este navegador no comparte la ubicación.");
      return;
    }
    setRouteState("locating");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setRoute(await fetchNearby(position.coords.latitude, position.coords.longitude));
          setRouteState("idle");
        } catch (err) {
          setRouteState("error");
          setRouteError(err instanceof Error ? err.message : "No pudimos armar la ruta.");
        }
      },
      () => {
        setRouteState("error");
        setRouteError("Necesitamos tu ubicación para armar la ruta. Revisa el permiso del navegador.");
      },
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  }

  return { result: data, isLoading, setBounds, route, routeState, routeError, planRoute, clearRoute: () => setRoute([]) };
}
