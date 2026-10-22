"use client";

import { useEffect } from "react";
import { Search } from "lucide-react";

import { usePlaceSearch } from "@/hooks/usePlaceSearch";

import type { DeliveryAreaFieldProps } from "@/features/configuracion/interfaces/paymentsAndDelivery";

/** The area served, as a name: picking a suggestion keeps its label, no coordinates needed. */
export function DeliveryAreaField({ value, onChange }: DeliveryAreaFieldProps) {
  const { query, setQuery, places, unavailable, pick } = usePlaceSearch(value);
  useEffect(() => setQuery(value), [value, setQuery]);

  return (
    <div className="relative text-sm font-semibold text-foreground">
      <label htmlFor="delivery-area">Zona que atiendes</label>
      <div className="relative mt-1.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          id="delivery-area"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => onChange(query.trim())}
          placeholder="Busca una ciudad o zona"
          className="min-h-11 w-full rounded-xl border border-border bg-background py-0 pl-9 pr-3 text-sm font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
      </div>
      {places.length > 0 ? (
        <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-lg">
          {places.map((place) => (
            <button
              key={place.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                void pick(place, { withCoordinates: false });
                onChange(place.label);
              }}
              className="flex min-h-11 w-full cursor-pointer items-center rounded-lg px-3 text-left text-sm font-normal text-foreground hover:bg-muted"
            >
              {place.label}
            </button>
          ))}
        </div>
      ) : null}
      <span className="mt-1.5 block text-xs font-normal leading-5 text-muted-foreground">
        Busca la ciudad o colonia; también puedes describir una cobertura más amplia.
      </span>
      {unavailable ? (
        <span className="mt-1 block text-xs font-normal text-amber-700">La búsqueda no respondió; puedes escribir la zona a mano.</span>
      ) : null}
    </div>
  );
}
