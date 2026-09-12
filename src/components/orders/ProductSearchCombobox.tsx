"use client";

import { useState, useRef, useEffect, useId } from "react";
import { Package, Wrench } from "lucide-react";
import type { ProductListItem } from "@/types/products";

interface ProductSearchComboboxProps {
  products: ProductListItem[];
  value: string;
  onChange: (productId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchMode?: "client" | "server";
  onQueryChange?: (query: string) => void;
  isSearching?: boolean;
  emptyHint?: string;
  /** Conserva la selección visible cuando la búsqueda remota ya se limpió. */
  selectedProduct?: ProductListItem | null;
}

function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function ProductSearchCombobox({
  products,
  value,
  onChange,
  placeholder = "Buscar producto o servicio...",
  disabled = false,
  searchMode = "client",
  onQueryChange,
  isSearching = false,
  emptyHint,
  selectedProduct = null,
}: ProductSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsId = useId();

  const selected =
    selectedProduct?.id === value
      ? selectedProduct
      : products.find((p) => p.id === value);
  const displayValue = selected
    ? selected.name
    : query;

  const normalizedQuery = normalizeForSearch(query);
  const isServerMode = searchMode === "server" && onQueryChange;

  const filtered = isServerMode
    ? products
    : normalizedQuery.trim()
      ? products.filter((p) => {
          const matchName = normalizeForSearch(p.name).includes(
            normalizedQuery,
          );
          const matchSubcatalog = p.subcatalog
            ? normalizeForSearch(p.subcatalog.name).includes(normalizedQuery)
            : false;
          return matchName || matchSubcatalog;
        })
      : products;

  useEffect(() => {
    if (isServerMode) onQueryChange(query);
  }, [query, isServerMode, onQueryChange]);

  useEffect(() => {
    if (!isOpen) setHighlightIndex(0);
  }, [isOpen, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(productId: string) {
    onChange(productId);
    setQuery("");
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlightIndex];
      if (item) handleSelect(item.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={isOpen ? query : displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="block w-full min-h-11 rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={resultsId}
      />
      {isOpen && (
        <ul
          id={resultsId}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-surface-raised py-1 shadow-lg"
          role="listbox"
        >
          {isSearching ? (
            <li className="flex min-h-(--touch-target,44px) cursor-default items-center gap-2 px-3 py-2.5 text-sm text-muted">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent"
                aria-hidden
              />
              Buscando...
            </li>
          ) : filtered.length === 0 ? (
            <li className="flex min-h-(--touch-target,44px) items-center px-3 py-2.5 text-sm text-muted">
              {emptyHint ?? "Sin resultados"}
            </li>
          ) : (
            filtered.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={p.id === value}
                onMouseEnter={() => setHighlightIndex(i)}
                onClick={() => handleSelect(p.id)}
                className={`flex min-h-(--touch-target,44px) cursor-pointer items-center gap-3 px-3 py-2 text-sm ${
                  i === highlightIndex
                    ? "bg-accent/10 text-foreground"
                    : "text-foreground hover:bg-border-soft/60"
                }`}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-border-soft/50">
                  {p.image_url ? (
                    // These URLs may belong to each tenant's Storage bucket, so a
                    // native image keeps the combobox compatible with any host.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : p.type === "service" ? (
                    <Wrench className="h-4 w-4 text-accent" aria-hidden />
                  ) : (
                    <Package className="h-4 w-4 text-muted" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                    <span>{p.type === "service" ? "Servicio" : "Producto"}</span>
                    {p.subcatalog?.name && (
                      <span className="truncate">· {p.subcatalog.name}</span>
                    )}
                  </span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-accent">
                  ${Number(p.price).toFixed(2)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
