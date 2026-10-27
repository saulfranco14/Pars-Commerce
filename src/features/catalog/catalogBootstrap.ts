/* eslint-disable @typescript-eslint/no-explicit-any -- catalog tables ship in their migration. */
import type { SupabaseClient } from "@supabase/supabase-js";

import { STARTER_CATALOGS, catalogImageUrl } from "@/features/catalog/catalogDefinitions";
import { deriveSlug } from "@/features/onboarding/helpers/deriveSlug";

type Db = SupabaseClient<any>;

/** Idempotently makes the commercial starter catalogs available after migration. */
export async function ensureCatalogTemplates(client: unknown): Promise<void> {
  const admin = client as Db;

  for (const definition of STARTER_CATALOGS) {
    const { data: template, error: templateError } = await admin
      .from("catalog_templates")
      .upsert({
        key: definition.key,
        version: definition.version ?? 1,
        business_type: definition.businessType,
        name: definition.name,
        description: definition.description,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" })
      .select("id")
      .single();
    if (templateError || !template) throw new Error(templateError?.message ?? "No pudimos preparar el catálogo");

    const categoryNames = Array.from(
      new Set(
        [...definition.products, ...definition.services].map(
          (item) => item.category ?? (item.type === "product" ? "Productos" : "Servicios"),
        ),
      ),
    );
    const categories = categoryNames.map((name, position) => ({
      template_id: template.id,
      name,
      slug: deriveSlug(name),
      position,
    }));
    const { data: storedCategories, error: categoryError } = await admin
      .from("catalog_template_categories")
      .upsert(categories, { onConflict: "template_id,slug" })
      .select("id, slug");
    if (categoryError || !storedCategories) throw new Error(categoryError?.message ?? "No pudimos preparar las categorías");

    const categoryBySlug = new Map(storedCategories.map((category: { id: string; slug: string }) => [category.slug, category.id]));
    const items = [...definition.products, ...definition.services].map((item, position) => ({
      template_id: template.id,
      category_id: categoryBySlug.get(
        deriveSlug(item.category ?? (item.type === "product" ? "Productos" : "Servicios")),
      ),
      type: item.type,
      name: item.name,
      slug: deriveSlug(item.name),
      description: item.description ?? null,
      price: item.price,
      unit: item.unit ?? "unit",
      is_public: item.isPublic ?? true,
      track_stock: item.type === "product",
      initial_stock: item.type === "product" ? 12 : 0,
      image_url: item.imageUrl ?? catalogImageUrl(),
      position,
    }));
    const { error: itemError } = await admin
      .from("catalog_template_items")
      .upsert(items, { onConflict: "template_id,slug" });
    if (itemError) throw new Error(itemError.message);

    // Mantiene la plantilla idéntica a la definición: actualizar una versión
    // no debe dejar artículos o categorías obsoletos mezclados con la nueva.
    const desiredItemSlugs = new Set(items.map((item) => item.slug));
    const { data: storedItems } = await admin
      .from("catalog_template_items")
      .select("id, slug")
      .eq("template_id", template.id);
    const staleItemIds = (storedItems ?? [])
      .filter((item: { slug: string }) => !desiredItemSlugs.has(item.slug))
      .map((item: { id: string }) => item.id);
    if (staleItemIds.length > 0) {
      const { error: staleItemsError } = await admin
        .from("catalog_template_items")
        .delete()
        .in("id", staleItemIds);
      if (staleItemsError) throw new Error(staleItemsError.message);
    }

    const desiredCategorySlugs = new Set(categories.map((category) => category.slug));
    const { data: allCategories } = await admin
      .from("catalog_template_categories")
      .select("id, slug")
      .eq("template_id", template.id);
    const staleCategoryIds = (allCategories ?? [])
      .filter((category: { slug: string }) => !desiredCategorySlugs.has(category.slug))
      .map((category: { id: string }) => category.id);
    if (staleCategoryIds.length > 0) {
      const { error: staleCategoriesError } = await admin
        .from("catalog_template_categories")
        .delete()
        .in("id", staleCategoryIds);
      if (staleCategoriesError) throw new Error(staleCategoriesError.message);
    }
  }
}
