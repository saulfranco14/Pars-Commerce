import Image from "next/image";
import { notFound } from "next/navigation";
import { Store } from "lucide-react";

import { StoreEmptyState } from "@/features/sitio/components/StoreEmptyState";
import { StorePageHeader } from "@/features/sitio/components/StorePageHeader";

import { catalogHref } from "@/features/sitio/helpers/storeLinks";
import { getStorePageContent, getStoreTenant } from "@/features/sitio/services/storefrontService";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = { title: "Nosotros" };

export default async function NosotrosPage({ params }: PageProps) {
  const { slug } = await params;
  const tenant = await getStoreTenant(slug);
  if (!tenant) notFound();

  const content = await getStorePageContent(tenant.id, "nosotros");
  const body = content.body?.trim() || tenant.description?.trim();

  return (
    <div className="space-y-8 sm:space-y-10">
      <StorePageHeader title={content.title || `Sobre ${tenant.name}`} />

      {content.image_url ? (
        <div className="relative aspect-video overflow-hidden rounded-(--store-radius) bg-(--store-well) sm:aspect-21/9">
          <Image
            src={content.image_url}
            alt=""
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      {body ? (
        <p className="max-w-3xl whitespace-pre-line text-[17px] leading-relaxed text-(--store-ink-2) sm:text-xl">
          {body}
        </p>
      ) : !content.image_url ? (
        <StoreEmptyState
          icon={Store}
          title="Pronto conocerás más de este negocio"
          description="Mientras tanto, explora lo que ofrece."
          action={{ href: catalogHref(slug), label: "Ver catálogo" }}
        />
      ) : null}
    </div>
  );
}
