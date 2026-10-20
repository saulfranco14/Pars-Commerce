import { notFound } from "next/navigation";

import { OrdersClosedNotice } from "@/features/checkout/components/cart/OrdersClosedNotice";
import { StoreShell } from "@/features/sitio/components/shell/StoreShell";

import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { buildStoreNavLinks, buildStoreQuickLinks } from "@/features/sitio/helpers/storeNav";
import { resolveStoreTheme } from "@/features/sitio/helpers/storeTheme";
import {
  getActivePromotions,
  getCatalogIndex,
  getStoreLayoutVariant,
  getStoreNavPages,
  getStoreTenant,
} from "@/features/sitio/services/storefrontService";

import type { Metadata } from "next";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Pick<LayoutProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getStoreTenant(slug);
  if (!tenant) return {};
  return {
    title: { default: tenant.name, template: `%s · ${tenant.name}` },
    description: tenant.description ?? `Compra en línea en ${tenant.name}.`,
  };
}

export default async function SitioLayout({ children, params }: LayoutProps) {
  const { slug } = await params;
  const tenant = await getStoreTenant(slug);
  if (!tenant) notFound();

  const [layoutVariant, pages, catalog, promotions] = await Promise.all([
    getStoreLayoutVariant(tenant.site_template_id),
    getStoreNavPages(tenant.id),
    getCatalogIndex(tenant.id),
    getActivePromotions(tenant.id),
  ]);

  const onboarding = (tenant.settings?.onboarding as Record<string, unknown> | undefined) ?? {};
  const chrome = {
    slug,
    tenantName: tenant.name,
    tenantDescription: tenant.description,
    logoUrl: tenant.logo_url,
    navLinks: buildStoreNavLinks(slug, pages, catalog.counts, promotions.length > 0),
    quickLinks: buildStoreQuickLinks(slug, catalog.counts, catalog.categories, promotions),
    whatsappPhone: tenant.whatsapp_phone,
    socialLinks: tenant.social_links ?? {},
  };

  return (
    <StoreShell
      chrome={chrome}
      theme={resolveStoreTheme(layoutVariant)}
      accent={tenant.theme_color?.trim() || DEFAULT_TENANT_ACCENT}
      tenantId={tenant.id}
      notice={
        // Shown on every page so nobody builds a whole order before learning it can't be placed.
        tenant.accepting_orders === false ? (
          <div className="mb-4">
            <OrdersClosedNotice businessName={tenant.name} preparing={onboarding.status === "in_progress"} />
          </div>
        ) : null
      }
    >
      {children}
    </StoreShell>
  );
}
