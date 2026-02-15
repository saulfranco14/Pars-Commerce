import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Heart,
  Shield,
  Lock,
  Gift,
  ShoppingCart,
  MessageCircle,
  Package,
} from "lucide-react";
import type {
  SitePageCard,
  SitePagePurchaseStep,
  SitePageFaqItem,
} from "@/types/tenantSitePages";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const ICON_MAP = {
  heart: Heart,
  shield: Shield,
  lock: Lock,
  gift: Gift,
} as const;

const DEFAULT_CARDS: SitePageCard[] = [
  {
    icon: "heart",
    title: "Bienestar",
    description:
      "Creemos en el bienestar como pilar de una vida plena. Ofrecemos productos de calidad para redescubrir y disfrutar.",
  },
  {
    icon: "shield",
    title: "Calidad garantizada",
    description:
      "Productos certificados, seguros y fabricados con materiales premium. Tu satisfacción es nuestra prioridad.",
  },
  {
    icon: "lock",
    title: "Discreción total",
    description:
      "Respetamos tu privacidad. Empaque sin marca identificable y entrega confidencial para comprar con tranquilidad.",
  },
  {
    icon: "gift",
    title: "Entrega personalizada",
    description:
      "Adaptamos nuestro servicio a tu comodidad y preferencias. Elige la opción que mejor te funcione.",
  },
];

const DEFAULT_PURCHASE_STEPS: SitePagePurchaseStep[] = [
  {
    title: "Selecciona tu producto",
    description:
      "Explora nuestro catálogo y elige el producto perfecto para ti.",
  },
  {
    title: "Realiza tu pedido",
    description: "Contáctanos por WhatsApp con tu selección.",
  },
  {
    title: "Recibe y disfruta",
    description:
      "Tu paquete lo podrás en nuestro negocio o lo llevaremos a tu domicilio.",
  },
];

export default async function InicioPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, description, theme_color")
    .eq("slug", slug)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: page } = await supabase
    .from("tenant_site_pages")
    .select("content")
    .eq("tenant_id", tenant.id)
    .eq("slug", "inicio")
    .eq("is_enabled", true)
    .single();

  const rawContent = (page?.content as Record<string, unknown> | null) ?? {};
  const cards =
    (rawContent.cards as SitePageCard[] | undefined)?.filter((c) => c?.title) ??
    DEFAULT_CARDS;
  const purchaseProcess =
    (rawContent.purchase_process as SitePagePurchaseStep[] | undefined)?.filter(
      (s) => s?.title,
    ) ?? DEFAULT_PURCHASE_STEPS;
  const deliveryBannerText = (rawContent.delivery_banner_text as string) ?? "";
  const faqItems =
    (rawContent.faq_items as SitePageFaqItem[] | undefined)?.filter(
      (f) => f?.question,
    ) ?? [];
  const content = rawContent as Record<string, string>;
  const accentColor = tenant.theme_color?.trim() || "#6366f1";

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden rounded-2xl shadow-lg"
        style={{
          background: content.hero_image_url
            ? undefined
            : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc, ${accentColor}99)`,
        }}
      >
        {content.hero_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${content.hero_image_url})` }}
          >
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}

        <div className="relative z-10 px-8 py-16 sm:px-12 sm:py-24">
          <div className="max-w-2xl">
            {content.title ? (
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                {content.title}
              </h1>
            ) : (
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                Bienvenido a {tenant.name}
              </h1>
            )}

            {content.subtitle ? (
              <p className="mt-4 text-lg text-white/80 sm:text-xl">
                {content.subtitle}
              </p>
            ) : tenant.description ? (
              <p className="mt-4 text-lg text-white/80 sm:text-xl">
                {tenant.description}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={`/sitio/${slug}/productos`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold shadow-md transition-all hover:scale-105 hover:shadow-lg"
                style={{ color: accentColor }}
              >
                <ShoppingBag className="h-4 w-4" />
                Ver productos
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/sitio/${slug}/promociones`}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Sparkles className="h-4 w-4" />
                Promociones
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome text */}
      {content.welcome_text && (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <div
            className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:no-underline"
            style={{
              ["--tw-prose-links" as string]: accentColor,
            }}
            dangerouslySetInnerHTML={{ __html: content.welcome_text }}
          />
        </section>
      )}

      {/* 4 Cards */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.slice(0, 4).map((item, i) => {
          const IconComponent =
            item.icon && item.icon in ICON_MAP
              ? ICON_MAP[item.icon as keyof typeof ICON_MAP]
              : Heart;
          return (
            <div
              key={i}
              className="rounded-xl p-6 shadow-sm transition-shadow hover:shadow-md"
              style={{
                backgroundColor: `${accentColor}15`,
                borderLeft: `4px solid ${accentColor}`,
              }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${accentColor}25`,
                  color: accentColor,
                }}
              >
                <IconComponent className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                {item.title || "Card"}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {item.description || ""}
              </p>
            </div>
          );
        })}
      </section>

      {/* Proceso de compra */}
      <section>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Proceso de compra sencillo
        </h2>
        <p className="mb-6 text-gray-600">
          En solo 3 pasos simples, tu pedido está en camino
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {purchaseProcess.slice(0, 3).map((step, i) => {
            const icons = [ShoppingCart, MessageCircle, Package];
            const IconEl = icons[i] ?? ShoppingCart;
            return (
              <div
                key={i}
                className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm"
              >
                <div
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {i + 1}
                </div>
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${accentColor}15`,
                    color: accentColor,
                  }}
                >
                  <IconEl className="h-7 w-7" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">
                  {step.title || `Paso ${i + 1}`}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {step.description || ""}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Banner entrega discreta */}
      {deliveryBannerText && (
        <section
          className="rounded-xl px-6 py-4"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <p className="text-center font-medium text-gray-800">
            {deliveryBannerText}
          </p>
        </section>
      )}

      {/* FAQ */}
      {faqItems.length > 0 && (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-lg border border-gray-200"
              >
                <summary className="cursor-pointer px-4 py-3 font-medium text-gray-900">
                  {item.question}
                </summary>
                <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
