"use client";

import type { ConfigDireccionSectionProps } from "@/features/configuracion/interfaces/sections";
import {
  inputClassCompact,
  labelClass,
} from "@/features/configuracion/constants/formClasses";

export function ConfigDireccionSection({
  street,
  onStreetChange,
  city,
  onCityChange,
  state,
  onStateChange,
  postalCode,
  onPostalCodeChange,
  country,
  onCountryChange,
  phone,
  onPhoneChange,
}: ConfigDireccionSectionProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-snug">
        Se muestra en el ticket al imprimir.
      </p>
      <div>
        <label htmlFor="config-address-street" className={labelClass}>
          Calle y número
        </label>
        <input
          id="config-address-street"
          type="text"
          value={street}
          onChange={(e) => onStreetChange(e.target.value)}
          className={inputClassCompact}
          placeholder="Av. Principal 123"
        />
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
        <div>
          <label htmlFor="config-address-city" className={labelClass}>
            Ciudad
          </label>
          <input
            id="config-address-city"
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            className={inputClassCompact}
            placeholder="CDMX"
          />
        </div>
        <div>
          <label htmlFor="config-address-state" className={labelClass}>
            Estado/Región
          </label>
          <input
            id="config-address-state"
            type="text"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            className={inputClassCompact}
            placeholder="CDMX"
          />
        </div>
        <div>
          <label htmlFor="config-address-postal" className={labelClass}>
            Código postal
          </label>
          <input
            id="config-address-postal"
            type="text"
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            className={inputClassCompact}
            placeholder="06000"
          />
        </div>
        <div>
          <label htmlFor="config-address-country" className={labelClass}>
            País
          </label>
          <input
            id="config-address-country"
            type="text"
            value={country}
            onChange={(e) => onCountryChange(e.target.value)}
            className={inputClassCompact}
            placeholder="México"
          />
        </div>
      </div>
      <div>
        <label htmlFor="config-address-phone" className={labelClass}>
          Teléfono del negocio
        </label>
        <input
          id="config-address-phone"
          type="text"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className={inputClassCompact}
          placeholder="555-0000"
        />
      </div>
    </div>
  );
}
