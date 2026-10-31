"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";

import { formatBusinessName } from "@/features/growth/helpers/formatBusinessName";
import { giroCopy } from "@/features/growth/constants/giroCopy";
import { MAP_TILES } from "@/features/growth/constants/mapColors";
import { leadPath } from "@/features/growth/constants/routes";
import { INITIAL_BOUNDS } from "@/features/growth/hooks/useProspectMap";

import type { MapBounds, ProspectMapProps } from "@/features/growth/interfaces/map";

function BoundsWatcher({ onChange }: { onChange: (bounds: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const box = map.getBounds();
      onChange({ minLat: box.getSouth(), minLng: box.getWest(), maxLat: box.getNorth(), maxLng: box.getEast() });
    },
  });
  return null;
}

/** Fits the map to the route when one is drawn. */
function RouteFocus({ route }: Pick<ProspectMapProps, "route">) {
  const map = useMap();
  useEffect(() => {
    if (route.length) map.fitBounds(route.map((stop) => [stop.lat, stop.lng] as [number, number]), { padding: [40, 40], maxZoom: 16 });
  }, [map, route]);
  return null;
}

/** Leaflet map drawn on canvas, so 2,000 points stay smooth on a phone. */
export default function ProspectMap({ points, route, colorOf, onBoundsChange }: ProspectMapProps) {
  return (
    <MapContainer
      bounds={[[INITIAL_BOUNDS.minLat, INITIAL_BOUNDS.minLng], [INITIAL_BOUNDS.maxLat, INITIAL_BOUNDS.maxLng]]}
      preferCanvas
      scrollWheelZoom
      className="h-[60vh] min-h-80 w-full rounded-2xl"
    >
      <TileLayer url={MAP_TILES.url} attribution={MAP_TILES.attribution} />
      <BoundsWatcher onChange={onBoundsChange} />
      <RouteFocus route={route} />
      {points.map((point) => (
        <CircleMarker
          key={point.id}
          center={[point.lat, point.lng]}
          radius={point.stage === "nuevo" || point.stage === "sin_contacto" ? 3 : 5}
          pathOptions={{ color: "#ffffff", weight: 1, fillColor: colorOf(point), fillOpacity: 0.9 }}
        >
          <Popup>
            <strong>{formatBusinessName(point.business_name)}</strong>
            <br />
            {giroCopy(point.giro).label} · {point.colonia ? formatBusinessName(point.colonia) : point.municipio}
            <br />
            <a href={leadPath(point.id)}>Abrir su ficha</a>
          </Popup>
        </CircleMarker>
      ))}
      {route.map((stop, index) => (
        <CircleMarker key={`route-${stop.id}`} center={[stop.lat, stop.lng]} radius={11} pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#0f1c33", fillOpacity: 1 }}>
          <Tooltip permanent direction="center" className="border-0! bg-transparent! p-0! text-xs! font-bold! text-white! shadow-none!">{index + 1}</Tooltip>
          <Popup>
            <strong>{index + 1}. {formatBusinessName(stop.business_name)}</strong>
            <br />
            {Math.round(stop.distance_m)} m · <a href={leadPath(stop.id)}>Abrir su ficha</a>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
