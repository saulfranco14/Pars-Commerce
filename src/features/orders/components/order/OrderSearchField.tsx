"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import {
  DEBOUNCE_MS,
  SERVER_SEARCH_MIN_CHARS,
} from "@/features/orders/constants/search";
import { MAX_SEARCH_LENGTH } from "@/features/orders/helpers/orderSearchFilter";

interface OrderSearchFieldProps {
  /** Término ya estabilizado. El padre lo manda al servidor. */
  onSearch: (term: string) => void;
}

/**
 * Buscar el pedido por el número que el cliente canta en el mostrador. También
 * acepta nombre, teléfono o correo — quien llega sin su número igual se
 * encuentra.
 */
export function OrderSearchField({ onSearch }: OrderSearchFieldProps) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(draft), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, onSearch]);

  const tooShort =
    draft.trim().length > 0 && draft.trim().length < SERVER_SEARCH_MIN_CHARS;

  return (
    <div>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          inputMode="search"
          value={draft}
          maxLength={MAX_SEARCH_LENGTH}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Número, nombre o teléfono (4 letras del número bastan)"
          aria-label="Buscar pedido"
          className="input-form block min-h-11 w-full rounded-xl border border-border py-2 pl-11 pr-10 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        {draft && (
          <button
            type="button"
            onClick={() => setDraft("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-border-soft hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>
      {tooShort && (
        <p className="mt-1 text-xs text-muted-foreground">
          Escribe al menos {SERVER_SEARCH_MIN_CHARS} caracteres.
        </p>
      )}
    </div>
  );
}
