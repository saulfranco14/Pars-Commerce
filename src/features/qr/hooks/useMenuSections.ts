"use client";

import { useMemo, useState } from "react";

import type {
  QrSessionCategory,
  QrSessionMenuItem,
} from "@/features/qr/interfaces/tableSession";

interface UseMenuSectionsParams {
  products: QrSessionMenuItem[];
  categories: QrSessionCategory[];
}

export interface MenuSection {
  id: string;
  name: string;
  products: QrSessionMenuItem[];
}

interface UseMenuSectionsResult {
  query: string;
  setQuery: (value: string) => void;
  /** True when a search is active — the UI shows a flat filtered grid. */
  searching: boolean;
  /** Flat list matching the current query (only meaningful while searching). */
  filtered: QrSessionMenuItem[];
  /** Grouped sections (category order + a trailing "Otros" for uncategorized). */
  sections: MenuSection[];
  totalCount: number;
}

const UNCATEGORIZED_ID = "__uncategorized__";

/**
 * Derives the grouped menu (by subcatalog) plus a name search. Keeps the
 * component presentational: grouping + filtering logic live here, not in JSX.
 *
 * - No query → `sections`: one per category that has products, in the order
 *   the categories arrive, then an "Otros" section for products with no
 *   category. Categories with zero products are dropped.
 * - Query present → `searching` is true and `filtered` is the flat match list;
 *   the component renders a single grid instead of sections.
 */
export function useMenuSections({
  products,
  categories,
}: UseMenuSectionsParams): UseMenuSectionsResult {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);

  const sections = useMemo(() => {
    const byCategory = new Map<string, QrSessionMenuItem[]>();
    for (const p of products) {
      const key = p.subcatalog_id ?? UNCATEGORIZED_ID;
      const list = byCategory.get(key);
      if (list) list.push(p);
      else byCategory.set(key, [p]);
    }

    const result: MenuSection[] = [];
    for (const cat of categories) {
      const items = byCategory.get(cat.id);
      if (items && items.length > 0) {
        result.push({ id: cat.id, name: cat.name, products: items });
      }
    }
    const uncategorized = byCategory.get(UNCATEGORIZED_ID);
    if (uncategorized && uncategorized.length > 0) {
      // Only label it "Otros" when there are real categories too; otherwise the
      // single group needs no header.
      result.push({
        id: UNCATEGORIZED_ID,
        name: result.length > 0 ? "Otros" : "",
        products: uncategorized,
      });
    }
    return result;
  }, [products, categories]);

  return {
    query,
    setQuery,
    searching: query.trim().length > 0,
    filtered,
    sections,
    totalCount: products.length,
  };
}
