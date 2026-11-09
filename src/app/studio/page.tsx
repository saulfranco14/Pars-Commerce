import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingNav } from "@/features/landing/components/sections/LandingNav";
import { LandingFooter } from "@/features/landing/components/sections/LandingFooter";
import { studioFlags } from "@/features/studio/services/studioFlags";
import { getStudioLandingCatalog } from "@/features/studio/services/studioCatalogService";
import {
  StudioLandingHero,
  StudioExamples,
  StudioHowItWorks,
  StudioChannels,
} from "@/features/studio/components/landing/StudioLandingSections";
import { StudioPricing } from "@/features/studio/components/landing/StudioPricing";
import { StudioFaq } from "@/features/studio/components/landing/StudioFaq";
import { StudioLandingAnalytics } from "@/features/studio/components/landing/StudioEntryCta";
import { studioEntryHref } from "@/features/studio/helpers/entry";
import { getPublicAppUrl } from "@/lib/env/appUrl";
import { formatCurrency } from "@/features/qr/helpers/format";

const DESCRIPTION =
  "Diseña anuncios de tus productos, promociones y combos. Edita fotos, precios y textos, y descarga tus diseños para compartirlos.";
export const revalidate = 60;
export const metadata: Metadata = {
  title: { absolute: "Tlaco Studio | Crea anuncios para tu negocio" },
  description: DESCRIPTION,
  alternates: { canonical: "/studio" },
  openGraph: {
    title: "Tlaco Studio · Tu catálogo, listo para anunciar",
    description: DESCRIPTION,
    url: "/studio",
    images: [
      {
        url: "/studio/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Tlaco Studio, anuncios para tu negocio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tlaco Studio",
    description: DESCRIPTION,
    images: ["/studio/opengraph-image"],
  },
};
export default async function StudioPage() {
  const flags = studioFlags();
  if (!flags.public) notFound();
  const catalog = await getStudioLandingCatalog();
  const starting = catalog.plans[0]
      ? formatCurrency(catalog.plans[0].amount_mxn)
      : null,
    href = studioEntryHref(),
    login = `/login?next=${encodeURIComponent(href)}`;
  const links = [
    { label: "Ejemplos", href: "#ejemplos" },
    { label: "Cómo funciona", href: "#como-funciona" },
    { label: "Precios", href: "#precios" },
    { label: "Preguntas", href: "#preguntas" },
  ];
  const base = getPublicAppUrl(),
    structured = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${base}/studio#page`,
          url: `${base}/studio`,
          name: "Tlaco Studio",
          description: DESCRIPTION,
          inLanguage: "es-MX",
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Tlaco", item: base },
            {
              "@type": "ListItem",
              position: 2,
              name: "Tlaco Studio",
              item: `${base}/studio`,
            },
          ],
        },
        {
          "@type": "WebApplication",
          name: "Tlaco Studio",
          url: `${base}/studio`,
          applicationCategory: "DesignApplication",
          operatingSystem: "Web",
          provider: { "@type": "Organization", name: "Tlaco", url: base },
          offers: (catalog.status === "live" ? catalog.plans : []).map((p) => ({
            "@type": "Offer",
            name: p.name,
            price: p.amount_mxn,
            priceCurrency: "MXN",
            url: `${base}/studio#precios`,
          })),
        },
      ],
    };
  return (
    <div className="min-h-screen bg-background">
      <StudioLandingAnalytics />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
        }}
      />
      <LandingNav
        links={links}
        registrationHref={href}
        registrationLabel="Entrar a Studio"
        loginHref={login}
      />
      <div className="h-17" aria-hidden />
      <main>
        <StudioLandingHero
          startingPrice={starting}
          preview={catalog.status === "preview"}
        />
        <StudioExamples />
        <StudioHowItWorks />
        <StudioChannels publishEnabled={flags.publish} aiEnabled={flags.ai} />
        <StudioPricing
          {...catalog}
          checkoutEnabled={flags.checkout}
          aiEnabled={flags.ai}
        />
        <StudioFaq publishEnabled={flags.publish} aiEnabled={flags.ai} />
      </main>
      <LandingFooter
        links={[
          { label: "Plataforma Tlaco", href: "/#plataforma" },
          { label: "Tlaco Studio", href: "/studio" },
          { label: "Membresías Studio", href: "#precios" },
        ]}
        closing={{
          title: "Tu próximo anuncio empieza con tu negocio.",
          description:
            "Conserva tu catálogo y crea una composición que puedas ajustar antes de compartir.",
          href,
          label: "Crear mi primer diseño",
          loginHref: login,
          footnote:
            starting && catalog.status === "live"
              ? `Studio desde ${starting} MXN al mes, IVA incluido. Registro en Tlaco sin tarjeta.`
              : "Crear diseños requiere una membresía Studio.",
        }}
      />
    </div>
  );
}
