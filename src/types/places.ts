/** An address suggestion; coordinates may arrive only after it is picked (Google). */
export interface PlaceOption {
  id: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
}
