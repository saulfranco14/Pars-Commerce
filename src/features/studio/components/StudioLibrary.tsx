"use client";
import { useState } from "react";
import { Image as ImageIcon, Plus, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Notification } from "@/components/ui/Notification";
import { FormInput } from "@/components/ui/FormInput";
import {
  adminActionButtonSecondary,
  pageHeaderCta,
} from "@/components/admin/actionButtonClasses";
import { useStudioContext } from "./StudioProvider";
import { StudioDesignCard } from "./StudioDesignCard";
import { StudioLoading } from "./StudioLoading";
import { StudioOptions } from "./StudioOptions";
import { useStudioLibrary } from "../hooks/useStudioLibrary";

export function StudioLibrary() {
  const { tenantSlug, summary } = useStudioContext(),
    library = useStudioLibrary(),
    [search, setSearch] = useState("");
  const base = `/dashboard/${tenantSlug}/studio`;
  return (
    <div className="space-y-5">
      <PageHeader
        title="Mis diseños"
        description="Cada composición, sus versiones y tus archivos listos para compartir."
        action={
          summary?.permissions.includes("studio.create") ? (
            <Link href={`${base}/nuevo`} className={pageHeaderCta}>
              <Plus className="h-4 w-4" />
              Crear diseño
            </Link>
          ) : undefined
        }
      />
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          library.setQuery(search);
        }}
      >
        <div className="flex-1">
          <FormInput
            label="Buscar diseños"
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={adminActionButtonSecondary}>
          <Search className="h-4 w-4" />
          Buscar
        </button>
      </form>
      <StudioOptions
        label="Estado"
        value={library.status}
        options={[
          { value: "", label: "Todos" },
          { value: "draft", label: "Borradores" },
          { value: "ready", label: "Listos" },
          { value: "archived", label: "Archivados" },
        ]}
        onChange={library.setStatus}
      />
      {library.error && <Notification tone="error" message={library.error} />}
      {library.isLoading ? (
        <StudioLoading />
      ) : library.items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {library.items.map((design) => (
            <StudioDesignCard
              key={design.id}
              design={design}
              base={base}
              active={Boolean(
                summary?.enabled &&
                  summary.permissions.includes("studio.create"),
              )}
              busy={library.busy}
              onDuplicate={() => void library.duplicate(design)}
              onArchive={() => void library.archive(design)}
              onDownload={() => void library.download(design)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="Aquí comienza tu biblioteca"
          description="Crea tu primer anuncio desde un producto, una promoción o una idea propia."
        />
      )}
      {library.hasMore && (
        <button
          onClick={() => void library.loadMore()}
          className={adminActionButtonSecondary}
        >
          <ChevronDown className="h-4 w-4" />
          Cargar más
        </button>
      )}
    </div>
  );
}
