import type { GrowthMember } from "@/features/growth/interfaces/member";
import type { LeadStage, NearbyLead } from "@/features/growth/interfaces/lead";

export interface MapPoint {
  id: string;
  business_name: string;
  giro: string;
  municipio: string;
  colonia: string | null;
  lat: number;
  lng: number;
  stage: LeadStage;
  owner_user_id: string | null;
  has_phone: boolean;
}

export interface MapQuery {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
  giro?: string;
  owner?: string;
}

export interface MapResult {
  points: MapPoint[];
  /** Prospects in the box; the map draws at most 2,000 of them. */
  total: number;
}

export type MapColorMode = "estado" | "persona" | "telefono";

export interface MapBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface ProspectMapProps {
  points: MapPoint[];
  route: NearbyLead[];
  colorOf: (point: MapPoint) => string;
  onBoundsChange: (bounds: MapBounds) => void;
  /** A business picked in the search: the map flies to it and opens its card. */
  focus?: MapPoint | null;
}

export interface MapLegendItem {
  label: string;
  color: string;
  count: number;
}

export interface MapViewProps {
  giro?: string;
  owner?: string;
  people: GrowthMember[];
  /** The header search: on the map it lists matches to fly to instead of filtering points. */
  q?: string;
}
