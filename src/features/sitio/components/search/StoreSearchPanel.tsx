"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, ChevronRight, Package, Search, X } from "lucide-react";

import { useStoreSearch } from "@/features/sitio/hooks/useStoreSearch";
import { Skeleton } from "@/components/ui/Skeleton";

import { formatCurrency } from "@/features/qr/helpers/format";
import { storeFocusRing } from "@/features/sitio/constants/storeClasses";
import { catalogHref } from "@/features/sitio/helpers/storeLinks";

import type { StoreChrome } from "@/features/sitio/interfaces/storefront";

const ROW = `flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-(--store-well) ${storeFocusRing}`;

export function StoreSearchPanel({ chrome, onClose }: { chrome: StoreChrome; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, isSearching, hasQuery } = useStoreSearch({ slug: chrome.slug });
  const allResultsHref = catalogHref(chrome.slug, { q: query });

  useEffect(() => inputRef.current?.focus(), []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    router.push(allResultsHref);
    onClose();
  };

  return (
    <div
      id="store-search-panel"
      role="dialog"
      aria-modal="true"
      aria-label={`Buscar en ${chrome.tenantName}`}
      className="store-drop-in fixed inset-x-0 top-14 z-50 max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-b border-(--store-hairline) bg-(--store-surface) shadow-xl"
    >
      <div className="mx-auto max-w-3xl px-4 pb-6 pt-4 sm:px-6 sm:pb-8 sm:pt-6">
        <form role="search" onSubmit={submit} className="flex items-center gap-3 border-b border-(--store-hairline) pb-3">
          <Search className="h-5 w-5 shrink-0 text-(--store-ink-2)" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Buscar en ${chrome.tenantName}`}
            autoComplete="off"
            enterKeyHint="search"
            aria-label="Buscar productos y servicios"
            className="min-w-0 flex-1 bg-transparent text-xl font-medium text-(--store-ink) outline-none placeholder:text-(--store-ink-2)/70 sm:text-2xl [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Borrar búsqueda"
              className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-(--store-well) text-(--store-ink-2) ${storeFocusRing}`}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </form>

        <div className="mt-5" aria-live="polite">
          {!hasQuery ? (
            <>
              <h2 className="px-2 text-xs font-medium text-(--store-ink-2)">Accesos rápidos</h2>
              <ul className="mt-2">
                {chrome.quickLinks.map((link) => (
                  <li key={link.id}>
                    <Link href={link.href} onClick={onClose} className={`${ROW} text-[15px] text-(--store-ink)`}>
                      <ArrowRight className="h-4 w-4 text-(--store-ink-2)" aria-hidden />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : isSearching && results.length === 0 ? (
            <ul aria-label="Buscando">
              {[0, 1, 2].map((row) => (
                <li key={row} className="flex items-center gap-3 px-2 py-2">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <span className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/5" />
                    <Skeleton className="h-3 w-16" />
                  </span>
                </li>
              ))}
            </ul>
          ) : results.length === 0 ? (
            <p className="px-2 text-[15px] text-(--store-ink-2)">
              Sin resultados para “{query.trim()}”. Revisa la ortografía o prueba con otra palabra.
            </p>
          ) : (
            <>
              <h2 className="px-2 text-xs font-medium text-(--store-ink-2)">Sugerencias</h2>
              <ul className="mt-2">
                {results.map((result) => {
                  const FallbackIcon = result.type === "service" ? CalendarClock : Package;
                  return (
                    <li key={result.id}>
                      <Link href={result.href} onClick={onClose} className={ROW}>
                        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-(--store-well)">
                          {result.image ? (
                            <Image src={result.image} alt="" fill sizes="48px" className="object-cover" />
                          ) : (
                            <FallbackIcon className="h-5 w-5 text-(--store-ink-2)" aria-hidden />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium text-(--store-ink)">{result.name}</span>
                          <span className="block text-sm tabular-nums text-(--store-ink-2)">{formatCurrency(result.price)}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-(--store-ink-2)" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={allResultsHref}
                onClick={onClose}
                className={`${ROW} mt-2 text-[15px] font-medium text-(--store-ink)`}
              >
                <Search className="h-4 w-4 text-(--store-ink-2)" aria-hidden />
                Ver todos los resultados de “{query.trim()}”
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
