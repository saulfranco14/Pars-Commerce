import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Truck } from "lucide-react";

import { CategoryCards } from "@/features/sitio/components/home/CategoryCards";
import { ServiceMenu } from "@/features/sitio/components/home/ServiceMenu";
import { StoreClosingCta } from "@/features/sitio/components/home/StoreClosingCta";
import { StoreFaq } from "@/features/sitio/components/home/StoreFaq";
import { StoreHero } from "@/features/sitio/components/home/StoreHero";
import { StoreHighlights } from "@/features/sitio/components/home/StoreHighlights";
import { StorePurchaseSteps } from "@/features/sitio/components/home/StorePurchaseSteps";
import { StoreValueCards } from "@/features/sitio/components/home/StoreValueCards";
import { ProductGrid } from "@/features/sitio/components/catalog/ProductGrid";
import { PromotionCard } from "@/features/sitio/components/promotions/PromotionCard";
import { PlanCard } from "@/features/sitio/components/plans/PlanCard";
import { StoreSectionHeader } from "@/features/sitio/components/StoreSectionHeader";

import { HOME_PRODUCTS_LIMIT, HOME_SERVICES_LIMIT } from "@/features/sitio/constants/catalog";
import { DEFAULT_PURCHASE_STEPS } from "@/features/sitio/constants/inicio";
import { storeButtonSecondary, storeDisplayFont } from "@/features/sitio/constants/storeClasses";
import { buildStoreHighlights, pickShowcase, resolveHeroCopy } from "@/features/sitio/helpers/storeHome";
import { catalogHref, whatsappHref } from "@/features/sitio/helpers/storeLinks";
import {
  getActivePlans,
  getActivePromotions,
  getCatalogIndex,
  getCheckoutOptions,
  getStorePageContent,
  getStoreTenant,
  listCatalogItems,
} from "@/features/sitio/services/storefrontService";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function InicioPage({ params }: PageProps) {
  const { slug } = await params;
  const tenant = await getStoreTenant(slug);
  if (!tenant) notFound();

  const [content, catalog, promotions, plans, products, services, checkoutOptions] = await Promise.all([
    getStorePageContent(tenant.id, "inicio"),
    getCatalogIndex(tenant.id),
    getActivePromotions(tenant.id),
    getActivePlans(tenant.id),
    listCatalogItems({ tenantId: tenant.id, type: "product", sort: "newest", limit: HOME_PRODUCTS_LIMIT }),
    listCatalogItems({ tenantId: tenant.id, type: "service", sort: "featured", limit: HOME_SERVICES_LIMIT }),
    getCheckoutOptions(tenant),
  ]);

  const { counts } = catalog;
  const hero = resolveHeroCopy(content, counts, tenant.description);
  const onlyServices = counts.products === 0 && counts.services > 0;
  const highlights = buildStoreHighlights(checkoutOptions);
  const cards = (content.cards ?? []).filter((card) => card?.title);
  const steps = content.purchase_process?.filter((step) => step?.title) ?? DEFAULT_PURCHASE_STEPS;
  const faqItems = (content.faq_items ?? []).filter((item) => item?.question && item?.answer);
  const deliveryNote = content.delivery_banner_text?.trim();
  const welcomeText = content.welcome_text?.trim();

  return (
    <div className="space-y-14 sm:space-y-20">
      <div className="space-y-4 sm:space-y-5">
        <StoreHero
          tenantName={tenant.name}
          logoUrl={tenant.logo_url}
          title={hero.title}
          subtitle={hero.subtitle}
          imageUrl={content.hero_image_url || null}
          showcase={pickShowcase(slug, products, services)}
          primary={{
            href: catalogHref(slug, { type: onlyServices ? "service" : null }),
            label: onlyServices ? "Ver servicios" : "Ver catálogo",
          }}
          secondary={
            promotions.length > 0
              ? { href: `/sitio/${slug}/promociones`, label: "Promociones" }
              : counts.services > 0 && !onlyServices
                ? { href: catalogHref(slug, { type: "service" }), label: "Ver servicios" }
                : undefined
          }
        />
        {deliveryNote ? (
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-accent/10 px-4 py-3 text-center text-sm font-semibold text-(--store-ink)">
            <Truck className="h-4 w-4 shrink-0 text-accent" aria-hidden />
            {deliveryNote}
          </p>
        ) : null}
        {highlights.length > 0 ? <StoreHighlights items={highlights} /> : null}
        {catalog.categories.length > 0 ? (
          <div className="pt-4 sm:pt-6">
            <CategoryCards slug={slug} categories={catalog.categories} />
          </div>
        ) : null}
      </div>

      {promotions.length > 0 ? (
        <section aria-labelledby="home-promos-title">
          <StoreSectionHeader
            id="home-promos-title"
            title="Promociones"
            subtitle="Ofertas por tiempo limitado."
            action={promotions.length > 3 ? { href: `/sitio/${slug}/promociones`, label: "Ver todas" } : undefined}
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promotions.slice(0, 3).map((promotion) => (
              <li key={promotion.id}>
                <PromotionCard promotion={promotion} tenantId={tenant.id} slug={slug} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {plans.length > 0 ? (
        <section aria-labelledby="home-plans-title">
          <StoreSectionHeader
            id="home-plans-title"
            title="Suscripciones"
            subtitle="Lo de siempre, apartado para ti cada periodo."
            action={plans.length > 3 ? { href: `/sitio/${slug}/planes`, label: "Ver todas" } : undefined}
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.slice(0, 3).map((plan) => (
              <li key={plan.id}>
                <PlanCard plan={plan} tenantId={tenant.id} slug={slug} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {products.length > 0 ? (
        <section aria-labelledby="home-products-title">
          <StoreSectionHeader
            id="home-products-title"
            title="Lo más nuevo"
            subtitle={`Recién llegado a ${tenant.name}.`}
            action={{ href: catalogHref(slug, { type: "product" }), label: `Ver los ${counts.products}` }}
          />
          <ProductGrid items={products} tenantId={tenant.id} slug={slug} />
          {counts.products > products.length ? (
            <Link href={catalogHref(slug, { type: "product" })} className={`${storeButtonSecondary} mt-5 w-full sm:hidden`}>
              Ver los {counts.products} productos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </section>
      ) : null}

      {services.length > 0 ? (
        <ServiceMenu items={services} tenantId={tenant.id} slug={slug} total={counts.services} />
      ) : null}

      {welcomeText ? (
        <section className="mx-auto max-w-3xl text-center">
          <h2 className={`text-[28px] font-extrabold tracking-tight text-(--store-ink) sm:text-4xl ${storeDisplayFont}`}>
            Sobre {tenant.name}
          </h2>
          <p className="mt-4 whitespace-pre-line text-[17px] leading-relaxed text-(--store-ink-2)">{welcomeText}</p>
        </section>
      ) : null}

      {cards.length > 0 ? <StoreValueCards cards={cards.slice(0, 4)} /> : null}

      {steps.length > 0 ? <StorePurchaseSteps steps={steps.slice(0, 3)} /> : null}

      {faqItems.length > 0 ? <StoreFaq items={faqItems} /> : null}

      {tenant.whatsapp_phone ? (
        <StoreClosingCta
          title="¿Tienes alguna duda?"
          description={`Escríbele a ${tenant.name} y te responden directo.`}
          action={{ href: whatsappHref(tenant.whatsapp_phone), label: "Escribir por WhatsApp", external: true }}
        />
      ) : (
        <StoreClosingCta
          title="Todo listo para tu pedido"
          description="Explora el catálogo completo y paga en línea."
          action={{ href: catalogHref(slug), label: "Ver catálogo" }}
        />
      )}
    </div>
  );
}
