export interface ZonePoint {
  lat: number;
  lng: number;
  distance_m: number;
}

export interface ZoneIdea {
  title: string;
  action: string;
  test: string;
}

/** Same-giro businesses around a registered business, from the DENUE base: counts and dots, never names. */
export interface ZoneReport {
  giroLabel: string;
  plural: string;
  place: string;
  center: { lat: number; lng: number };
  within500: number;
  within1000: number;
  nearestM: number | null;
  points: ZonePoint[];
  ideas: ZoneIdea[];
}
