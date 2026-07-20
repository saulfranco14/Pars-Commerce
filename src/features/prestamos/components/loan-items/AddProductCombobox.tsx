"use client";

import { useState, useRef } from "react";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swrFetcher";
import { ProductSearchCombobox } from "@/components/orders/ProductSearchCombobox";
import type { ProductListItem } from "@/types/products";
import type { AddProductProps } from "@/features/prestamos/interfaces/loanForm";

export function AddProductCombobox({ activeTenantId, onAdd }: AddProductProps) {
  const [selectedId, setSelectedId] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const productsKey =
    debouncedQuery.length >= 2
      ? `/api/products?tenant_id=${activeTenantId}&q=${encodeURIComponent(debouncedQuery)}`
      : null;

  const { data, isLoading } = useSWR<ProductListItem[]>(productsKey, swrFetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
  });
  const products = Array.isArray(data) ? data : [];

  function handleQueryChange(q: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(q), 300);
  }

  function handleChange(productId: string) {
    setSelectedId(productId);
    if (!productId) return;
    const found = products.find((p) => p.id === productId);
    if (found) {
      onAdd(found);
      setTimeout(() => setSelectedId(""), 50);
    }
  }

  return (
    <ProductSearchCombobox
      products={products}
      value={selectedId}
      onChange={handleChange}
      searchMode="server"
      onQueryChange={handleQueryChange}
      isSearching={isLoading && debouncedQuery.length >= 2}
      placeholder="Escribe para buscar producto..."
      emptyHint={debouncedQuery.length >= 2 ? "Sin resultados" : "Escribe 2+ caracteres para buscar"}
    />
  );
}
