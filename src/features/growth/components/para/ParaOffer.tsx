import { LockKeyhole, MessageCircle } from "lucide-react";

import { ParaProductCard } from "@/features/growth/components/para/ParaProductCard";

import { PARA_PLACEMENT_BY_LAYOUT } from "@/features/growth/constants/para";

import type { ParaOfferProps } from "@/features/growth/interfaces/para";

/** What a business prospecting with Tlaco shows the prospect: who they are, the offer, their products, one button. */
export function ParaOffer({ data }: ParaOfferProps) {
  const cta = data.helpUrl ? (
    <a
      href={data.helpUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-para-action={`help:${PARA_PLACEMENT_BY_LAYOUT.block}`}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-6 text-[15px] font-bold text-accent-foreground shadow-md shadow-accent/20 transition active:scale-[0.99]"
    >
      <MessageCircle className="h-5 w-5" aria-hidden />
      {data.ctaLabel}
    </a>
  ) : null;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border-soft bg-surface/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <span className="flex min-w-0 items-center gap-2">
            {data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- merchant logos live on any host
              <img src={data.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : null}
            <span className="truncate text-base font-bold text-foreground">{data.workspaceName}</span>
          </span>
          {data.helpUrl ? (
            <a href={data.helpUrl} target="_blank" rel="noopener noreferrer" data-para-action={`help:${PARA_PLACEMENT_BY_LAYOUT.bar}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground">
              <MessageCircle className="h-4 w-4" aria-hidden />{data.ctaLabel}
            </a>
          ) : null}
        </div>
      </header>
      <p className="flex items-center justify-center gap-2 bg-foreground px-4 py-2.5 text-center text-xs font-semibold text-balance text-background">
        <LockKeyhole className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Propuesta privada para {data.businessName}. Sólo usted tiene el link.
      </p>

      <section data-para-section="hero" className="px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-3xl gap-4 text-center">
          <p className="text-sm font-semibold text-muted-foreground">Para {data.businessName}</p>
          <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">{data.title}</h1>
          {data.text ? <p className="whitespace-pre-line text-base text-muted-foreground sm:text-lg">{data.text}</p> : null}
          {data.sender ? <p className="text-sm text-muted-foreground">Le escribe {data.sender.name}, de {data.workspaceName}.</p> : null}
          {cta ? <div className="flex justify-center">{cta}</div> : null}
        </div>
      </section>

      {data.items.length ? (
        <section data-para-section="productos" id="productos" className="border-t border-border-soft bg-surface px-4 py-10 sm:px-6">
          <div className="mx-auto grid max-w-5xl gap-5">
            <h2 className="text-xl font-bold tracking-tight">Lo que ofrecemos</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {data.items.map((item, index) => <ParaProductCard key={item.id} item={item} priority={index < 2} />)}
            </div>
          </div>
        </section>
      ) : null}

      {cta ? (
        <section data-para-section="cierre" className="border-t border-border-soft px-4 py-12 sm:px-6">
          <div className="mx-auto grid max-w-xl justify-items-center gap-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight">¿Le interesa?</h2>
            <p className="text-base text-muted-foreground">Escríbanos por WhatsApp y le contamos los detalles.</p>
            {cta}
          </div>
        </section>
      ) : null}
    </>
  );
}
