"use client";
import { useState } from "react";
import useSWR from "swr";
import { Check, Images, Loader2, X } from "lucide-react";
import { useStudioReuse } from "../hooks/useStudioReuse";
import { useStudioContext } from "./StudioProvider";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  actionPair,
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { loadSources } from "../services/studioClientService";
import type { StudioReuseMode } from "../hooks/useStudioReuse";
import type { StudioSourceType } from "../interfaces/studio";
import type {
  StudioReuseOption,
  StudioUseImageSheetProps,
} from "../interfaces/ui";

const TYPES = [
  { value: "product", label: "Productos" },
  { value: "promotion", label: "Promociones" },
  { value: "subscription_plan", label: "Planes" },
] as const;

export function StudioUseImageSheet({
  image,
  onClose,
}: StudioUseImageSheetProps) {
  const { tenantId, summary } = useStudioContext(),
    reuse = useStudioReuse(),
    [type, setType] = useState<StudioSourceType>("product"),
    [target, setTarget] = useState<{ id: string; name: string } | null>(null),
    [mode, setMode] = useState<StudioReuseMode>("as_is");
  const sources = useSWR(image ? ["studio-reuse", tenantId, type] : null, () =>
    loadSources(tenantId, type, ""),
  );
  const canAi = Boolean(summary?.aiEnabled && summary.balance.available >= 1);
  const options: StudioReuseOption[] = [
    {
      value: "as_is",
      title: "Tal cual",
      detail: "Misma imagen, textos de lo que elijas",
      cost: "Gratis",
    },
    ...(canAi
      ? [
          {
            value: "with_product" as const,
            title: "Con ese producto adentro",
            detail: "La IA lo pone en esta misma escena",
            cost: "1 Tlaco",
          },
        ]
      : []),
  ];
  return (
    <FormSheet
      isOpen={Boolean(image)}
      onClose={onClose}
      title="Usar esta imagen"
      icon={Images}
      footer={
        <div className={actionPair}>
          <button
            type="button"
            className={adminActionButtonSecondary}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            Cancelar
          </button>
          <button
            type="button"
            className={adminActionButtonPrimary}
            disabled={!target || reuse.busy}
            onClick={() =>
              image &&
              target &&
              void reuse.reuse(image, { type, ...target }, mode)
            }
          >
            {reuse.busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {reuse.busy ? "Creando…" : "Usar"}
          </button>
        </div>
      }
    >
      {image && (
        <div className="space-y-4 pb-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt=""
              className="h-16 w-16 shrink-0 rounded-xl object-cover"
            />
            <p className="text-sm text-muted-foreground">
              Hecha para “{image.title}”. ¿En qué la quieres usar?
            </p>
          </div>
          <FilterTabs
            tabs={TYPES}
            activeValue={type}
            onTabChange={(value) => {
              setType(value as StudioSourceType);
              setTarget(null);
            }}
            ariaLabel="Qué vas a anunciar"
            density="touch"
          />
          <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto">
            {sources.isLoading ? (
              <>
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </>
            ) : sources.data?.items.length ? (
              sources.data.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={target?.id === item.id}
                  onClick={() => setTarget(item)}
                  className={`flex min-h-12 w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-left text-sm ${target?.id === item.id ? "border-accent bg-accent/5" : "border-border"}`}
                >
                  <span className="min-w-0 truncate">{item.name}</span>
                  {target?.id === item.id && (
                    <Check className="h-4 w-4 shrink-0 text-accent" />
                  )}
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay nada aquí todavía.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={mode === option.value}
                onClick={() => setMode(option.value)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left ${mode === option.value ? "border-accent bg-accent/5" : "border-border"}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {option.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.detail}
                  </span>
                </span>
                <span className="text-xs font-bold whitespace-nowrap text-accent">
                  {option.cost}
                </span>
              </button>
            ))}
          </div>
          {reuse.busy && mode === "with_product" && (
            <p className="text-xs text-muted-foreground">
              Poniendo tu producto en la escena; tarda unos 20 segundos.
            </p>
          )}
          {reuse.error && <Notification tone="error" message={reuse.error} />}
        </div>
      )}
    </FormSheet>
  );
}
