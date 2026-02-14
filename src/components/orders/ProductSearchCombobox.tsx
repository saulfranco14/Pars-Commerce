"use client";

import { useState, useRef, useEffect } from "react";
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
}: ProductSearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = products.find((p) => p.id === value);
  const displayValue = selected
    ? selected.subcatalog
      ? `[${selected.subcatalog.name}] ${selected.name} — $${Number(selected.price).toFixed(2)}`
      : `${selected.name} — $${Number(selected.price).toFixed(2)}`
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
        className="block w-full rounded-xl border border-border bg-surface-raised px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
        autoComplete="off"
      />
      {isOpen && (
        <ul
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-surface-raised py-1 shadow-lg"
          role="listbox"
        >
          {isSearching ? (
            <li className="flex min-h-[44px] cursor-default items-center gap-2 px-3 py-2.5 text-sm text-muted">
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent"
                aria-hidden
              />
              Buscando...
            </li>
          ) : filtered.length === 0 ? (
            <li className="min-h-[44px] px-3 py-2.5 text-sm text-muted">
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
                className={`cursor-pointer px-3 py-2.5 text-sm ${
                  i === highlightIndex
                    ? "bg-accent/10 text-foreground"
                    : "text-foreground hover:bg-border-soft/60"
                }`}
              >
                <span>
                  {p.name} — ${Number(p.price).toFixed(2)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
