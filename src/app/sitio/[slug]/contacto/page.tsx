import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { StorePageHeader } from "@/features/sitio/components/StorePageHeader";
import { extractMapEmbedSrc } from "@/features/sitio/helpers/mapEmbed";
import {
  describeWeek,
  readBusinessHours,
} from "@/features/configuracion/helpers/businessHours";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ContactoPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color, settings")
    .eq("site_slug", slug)
    .eq("public_store_enabled", true)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const { data: page } = await supabase
    .from("tenant_site_pages")
    .select("content")
    .eq("tenant_id", tenant.id)
    .eq("slug", "contacto")
    .eq("is_enabled", true)
    .single();

  const content = (page?.content as Record<string, string> | null) ?? {};
  const accentColor = tenant.theme_color?.trim() || DEFAULT_TENANT_ACCENT;
  const mapSrc = extractMapEmbedSrc(content.map_embed);

  // Los horarios dados de alta mandan sobre el texto libre de esta página: son
  // los que aplica el selector de recolección, y dos fuentes distintas
  // acabarían contradiciéndose delante del cliente.
  const hours = readBusinessHours(
    tenant.settings as Record<string, unknown> | null,
  );
  const scheduleLines = hours
    ? describeWeek(hours)
    : content.schedule
      ? [content.schedule]
      : [];

  const contactItems = [
    {
      key: "email",
      icon: Mail,
      label: "Email",
      value: content.email,
      href: content.email ? `mailto:${content.email}` : undefined,
    },
    {
      key: "phone",
      icon: Phone,
      label: "Teléfono",
      value: content.phone,
      href: content.phone ? `tel:${content.phone}` : undefined,
    },
    {
      key: "address",
      icon: MapPin,
      label: "Dirección",
      value: content.address_text,
    },
  ].filter((item) => item.value);

  return (
    <div className="space-y-8">
      <StorePageHeader title={content.title || "Contacto"} description="Estamos para ayudarte." />

      {content.welcome_message && (
        <p className="max-w-3xl whitespace-pre-line text-[17px] leading-relaxed text-(--store-ink-2)">
          {content.welcome_message}
        </p>
      )}

      {/* Los horarios cuentan como dato de contacto: un negocio puede no tener
          correo ni teléfono capturados y aun así tener horario que mostrar. */}
      {contactItems.length > 0 || scheduleLines.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {contactItems.map((item) => {
            const Icon = item.icon;
            const inner = (
              <div className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${accentColor}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    {item.label}
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {item.value}
                  </p>
                </div>
              </div>
            );

            if (item.href) {
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className="block no-underline"
                >
                  {inner}
                </a>
              );
            }
            return <div key={item.key}>{inner}</div>;
          })}

          {scheduleLines.length > 0 && (
            <div className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <Clock className="h-5 w-5" style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Horario
                </p>
                {scheduleLines.map((line) => (
                  <p key={line} className="mt-1 font-medium text-gray-900">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <MessageCircle className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">
            Próximamente información de contacto.
          </p>
        </div>
      )}

      {mapSrc ? (
        <iframe
          src={mapSrc}
          title={`Ubicación de ${tenant.name}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="aspect-video w-full overflow-hidden rounded-(--store-radius) border-0 bg-(--store-well)"
        />
      ) : null}
    </div>
  );
}
