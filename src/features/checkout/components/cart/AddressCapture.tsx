"use client";

import { LocateFixed, MapPin, Search } from "lucide-react";

import { usePlaceSearch } from "@/hooks/usePlaceSearch";

import type { PlaceOption } from "@/types/places";

export type DeliveryAddress = { recipient_name: string; phone: string; address_text: string; reference: string; mapbox_feature_id?: string; latitude?: number | null; longitude?: number | null };

export function AddressCapture({ value, onChange }: { value: DeliveryAddress; onChange: (value: DeliveryAddress) => void }) {
  const { query: search, setQuery: setSearch, places, searching, unavailable, pick } = usePlaceSearch(value.address_text);

  const set = <Key extends keyof DeliveryAddress>(key: Key, next: DeliveryAddress[Key]) => onChange({ ...value, [key]: next });
  const selectPlace = async (picked: PlaceOption) => {
    onChange({ ...value, address_text: picked.label, mapbox_feature_id: picked.id, latitude: picked.latitude, longitude: picked.longitude });
    const place = await pick(picked);
    onChange({ ...value, address_text: picked.label, mapbox_feature_id: place.id, latitude: place.latitude, longitude: place.longitude });
  };

  return <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
    <div><p className="text-sm font-bold text-gray-900">¿A dónde lo llevamos?</p><p className="mt-1 text-xs leading-5 text-gray-500">Busca una dirección en México o escríbela manualmente.</p></div>
    <label className="relative block"><span className="sr-only">Buscar dirección</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); set("address_text", event.target.value); }} placeholder="Buscar dirección" className="min-h-11 w-full rounded-xl border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
    {searching ? <p className="text-xs text-gray-500">Buscando direcciones…</p> : null}
    {places.length > 0 ? <div className="overflow-hidden rounded-xl border border-gray-200">{places.map((place) => <button
      key={place.id}
      type="button"
      onPointerDown={(event) => {
        event.preventDefault();
        void selectPlace(place);
      }}
      onClick={(event) => {
        // Un click con detail=0 viene de teclado. Mouse/touch ya se resolvió
        // en pointerdown para que el primer toque no lo consuma el teclado.
        if (event.detail === 0) void selectPlace(place);
      }}
      className="flex min-h-11 w-full items-start gap-2 border-b border-gray-100 px-3 py-2.5 text-left text-sm last:border-0 hover:bg-gray-50"
    ><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />{place.label}</button>)}</div> : null}
    {unavailable ? <p className="text-xs text-amber-700">El mapa no está disponible; puedes continuar con la dirección manual.</p> : null}
    <div className="grid gap-3 sm:grid-cols-2"><Field label="Nombre de quien recibe" value={value.recipient_name} onChange={(next) => set("recipient_name", next)} /><Field label="Teléfono" value={value.phone} inputMode="tel" onChange={(next) => set("phone", next.replace(/\D/g, "").slice(0, 12))} /></div>
    <Field label="Dirección completa" value={value.address_text} onChange={(next) => { setSearch(next); set("address_text", next); }} placeholder="Calle, número, colonia, municipio y C.P." />
    <Field label="Referencia para entregar" value={value.reference} onChange={(next) => set("reference", next)} placeholder="Portón negro, junto a la papelería" />
    <p className="flex items-center gap-1.5 text-[11px] leading-4 text-gray-500"><LocateFixed className="h-3.5 w-3.5" />La ubicación sólo se usa para este pedido.</p>
  </section>;
}

function Field({ label, value, onChange, placeholder, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; inputMode?: "tel" }) {
  return <label className="block text-xs font-semibold text-gray-700"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} className="mt-1.5 min-h-11 w-full rounded-xl border border-gray-200 px-3 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>;
}
