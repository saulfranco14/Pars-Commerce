/* eslint-disable @typescript-eslint/no-explicit-any -- catalog tables ship in their migration. */
import type { SupabaseClient } from "@supabase/supabase-js";

import { DEMO_CATALOGS, catalogImageUrl } from "@/features/catalog/catalogDefinitions";
import { deriveSlug } from "@/features/onboarding/helpers/deriveSlug";

type Db = SupabaseClient<any>;

/** Idempotently makes the commercial starter catalogs available after migration. */
export async function ensureCatalogTemplates(client: unknown): Promise<void> {
  const admin = client as Db;

  for (const definition of DEMO_CATALOGS) {
    const { data: template, error: templateError } = await admin
      .from("catalog_templates")
      .upsert({
        key: definition.key,
        version: 1,
        business_type: definition.businessType,
        name: definition.name,
        description: definition.description,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" })
      .select("id")
      .single();
    if (templateError || !template) throw new Error(templateError?.message ?? "No pudimos preparar el catálogo");

    const categories = [
      { template_id: template.id, name: "Productos", slug: "productos", position: 0 },
      { template_id: template.id, name: "Servicios", slug: "servicios", position: 1 },
    ];
    const { data: storedCategories, error: categoryError } = await admin
      .from("catalog_template_categories")
      .upsert(categories, { onConflict: "template_id,slug" })
      .select("id, slug");
    if (categoryError || !storedCategories) throw new Error(categoryError?.message ?? "No pudimos preparar las categorías");

    const categoryBySlug = new Map(storedCategories.map((category: { id: string; slug: string }) => [category.slug, category.id]));
    const items = [...definition.products, ...definition.services].map((item, position) => ({
      template_id: template.id,
      category_id: categoryBySlug.get(item.type === "product" ? "productos" : "servicios"),
      type: item.type,
      name: item.name,
      slug: deriveSlug(item.name),
      description: `${item.name} de ejemplo para ${definition.name}. Puedes editarlo o eliminarlo después.`,
      price: item.price,
      unit: "unit",
      track_stock: item.type === "product",
      initial_stock: item.type === "product" ? 12 : 0,
      image_url: catalogImageUrl(),
      position,
    }));
    const { error: itemError } = await admin
      .from("catalog_template_items")
      .upsert(items, { onConflict: "template_id,slug" });
    if (itemError) throw new Error(itemError.message);
  }
}
