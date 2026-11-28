"use client";

import "leaflet/dist/leaflet.css";

import { Circle, CircleMarker, MapContainer, TileLayer } from "react-leaflet";

import { MAP_TILES } from "@/features/growth/constants/mapColors";

import type { ZoneReport } from "@/features/growth/interfaces/zoneReport";

const RING = { color: "#2563eb", weight: 1.5, dashArray: "4 6", fillColor: "#2563eb", fillOpacity: 0.05 };

/** The business in gold, same-giro businesses as dots, rings at 500 m and 1 km. Dots only: no names. */
export default function ZoneMap({ report }: { report: Pick<ZoneReport, "center" | "points"> }) {
  const center: [number, number] = [report.center.lat, report.center.lng];
  return (
    <MapContainer center={center} zoom={15} scrollWheelZoom={false} className="h-72 w-full sm:h-96" attributionControl>
      <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} />
      <Circle center={center} radius={1000} pathOptions={{ ...RING, fillOpacity: 0.02 }} />
      <Circle center={center} radius={500} pathOptions={RING} />
      {report.points.map((point, index) => (
        <CircleMarker key={index} center={[point.lat, point.lng]} radius={5} pathOptions={{ color: "#ffffff", weight: 1.5, fillColor: point.distance_m <= 500 ? "#2563eb" : "#93a4c3", fillOpacity: 1 }} />
      ))}
      <CircleMarker center={center} radius={10} pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#d69e14", fillOpacity: 1 }} />
    </MapContainer>
  );
}
