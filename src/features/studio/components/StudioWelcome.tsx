"use client";
import { Coins, MessageCircle, Package, Store } from "lucide-react";
import { FeatureTour } from "@/components/onboarding/FeatureTour";
import { STUDIO_ONBOARDING_KEY } from "@/features/onboarding/constants";
import { STUDIO_GIFT_TLACOS, STUDIO_QUALITIES } from "../constants/studio";
import type { FeatureTourSlide } from "@/types/featureTour";

const premiumCost =
  STUDIO_QUALITIES.find((q) => q.value === "premium")?.cost ?? 3;

const SLIDES: FeatureTourSlide[] = [
  {
    id: "anuncios",
    title: "Anuncios con lo que ya vendes",
    description:
      "Eliges un producto y te lo damos hecho, con tu precio y tu logo.",
    visual: (
      <div className="flex aspect-4/5 w-48 flex-col justify-between rounded-3xl bg-linear-to-br from-accent to-blue-800 p-4 text-left text-white shadow-xl">
        <span className="text-[10px] font-bold tracking-widest opacity-80">
          TU NEGOCIO
        </span>
        <span className="flex h-20 w-20 items-center justify-center self-center rounded-full bg-white/15">
          <Package className="h-10 w-10" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-semibold opacity-90">
            Tu producto
          </span>
          <span className="block text-3xl font-bold tracking-tight">$120</span>
        </span>
      </div>
    ),
  },
  {
    id: "tlacos",
    title: "Tlacos de regalo",
    description: `Cada imagen con IA cuesta 1 Tlaco; la Premium, ${premiumCost}. Diseñar, cambiar textos y compartir es gratis.`,
    visual: (
      <span className="flex flex-col items-center gap-2 text-accent">
        <Coins className="h-10 w-10" aria-hidden />
        <span className="text-8xl leading-none font-bold tracking-tighter tabular-nums">
          {STUDIO_GIFT_TLACOS}
        </span>
      </span>
    ),
  },
  {
    id: "compartir",
    title: "Lo compartes y queda en tu tienda",
    description:
      "Mándalo por WhatsApp o ponlo en tu tienda. Si cambias el precio, el anuncio se actualiza solo.",
    visual: (
      <div className="grid w-full grid-cols-2 gap-3">
        {[
          { icon: MessageCircle, title: "WhatsApp", text: "Chats y Estado" },
          { icon: Store, title: "Tu tienda", text: "Foto del producto" },
        ].map(({ icon: Icon, title, text }) => (
          <span
            key={title}
            className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 text-left shadow-sm"
          >
            <Icon className="h-6 w-6 text-accent" aria-hidden />
            <span className="mt-1 text-sm font-bold">{title}</span>
            <span className="text-xs text-muted-foreground">{text}</span>
          </span>
        ))}
      </div>
    ),
  },
];

/** First visit to Studio: what it is, the gifted Tlacos and where an ad goes. */
export function StudioWelcome() {
  return (
    <FeatureTour
      storageKey={STUDIO_ONBOARDING_KEY}
      label="Bienvenida a Tlaco Studio"
      slides={SLIDES}
      finishLabel="Empezar"
    />
  );
}
