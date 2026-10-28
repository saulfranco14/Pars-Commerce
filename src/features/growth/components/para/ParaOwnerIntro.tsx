import { Check } from "lucide-react";

import { ParaActions } from "@/features/growth/components/para/ParaActions";

import { PARA_OWNER_BENEFITS } from "@/features/growth/constants/para";

import type { ParaPageData } from "@/features/growth/interfaces/para";

/** First thing the owner reads: who made this, and that below is what their customers would see. */
export function ParaOwnerIntro({ data }: { data: ParaPageData }) {
  const { sender } = data;
  return (
    <section
      data-para-section="intro"
      aria-labelledby="para-intro-title"
      className="grid gap-5 rounded-(--store-radius) bg-(--store-surface) p-5 shadow-sm ring-1 ring-(--store-hairline) sm:p-7"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--store-ink) text-base font-bold text-(--store-surface)">
          {sender?.initial ?? "T"}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-(--store-ink)">{sender ? `${sender.name}, de Tlaco` : "El equipo de Tlaco"}</p>
          <p className="text-[13px] text-(--store-ink-2)">Preparó esta vista para {data.businessName}.</p>
        </div>
      </div>

      <div className="grid gap-3">
        <h2 id="para-intro-title" className="text-2xl font-bold leading-tight tracking-tight text-balance text-(--store-ink) sm:text-3xl">
          Así verían su tienda sus clientes.
        </h2>
        <ul className="grid gap-2.5">
          {PARA_OWNER_BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-2.5 text-[15px] leading-snug text-(--store-ink)">
              <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-600" aria-hidden />
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <ParaActions claimUrl={data.claimUrl} helpUrl={data.helpUrl} helpLabel={data.helpLabel} layout="intro" />
    </section>
  );
}
