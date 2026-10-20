import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";
import { storeDisplayFont, storeFocusRing } from "@/features/sitio/constants/storeClasses";

import type { HeroShowcaseItem, StoreHeroProps } from "@/features/sitio/interfaces/storeHome";

const PRIMARY = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent-foreground px-6 text-[15px] font-bold text-accent shadow-lg shadow-black/10 transition-transform motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98] ${storeFocusRing}`;
const SECONDARY = `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold text-accent-foreground ring-2 ring-accent-foreground/35 transition-colors hover:bg-accent-foreground/10 ${storeFocusRing}`;

function ShowcaseCard({ item, large, priority }: { item: HeroShowcaseItem; large?: boolean; priority?: boolean }) {
  return (
    <Link
      href={item.href}
      className={`group relative block h-full overflow-hidden rounded-2xl bg-black/10 shadow-2xl shadow-black/25 ring-1 ring-white/20 sm:rounded-3xl ${storeFocusRing}`}
    >
      <Image
        src={item.image}
        alt={item.name}
        fill
        priority={priority}
        sizes={large ? "(max-width: 1024px) 60vw, 34vw" : "(max-width: 1024px) 40vw, 20vw"}
        className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
      />
      <span
        className={`absolute bottom-2 flex items-center justify-between gap-2 rounded-xl bg-white/95 px-3 py-2 text-neutral-950 shadow-lg backdrop-blur sm:inset-x-3 sm:bottom-3 ${
          large ? "inset-x-2" : "right-2 sm:left-3"
        }`}
      >
        <span className={`min-w-0 truncate font-semibold ${large ? "text-sm sm:text-[15px]" : "hidden text-sm sm:block"}`}>
          {item.name}
        </span>
        <span className={`shrink-0 font-bold tabular-nums ${large ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}>
          {formatCurrency(item.price)}
        </span>
      </span>
    </Link>
  );
}

export function StoreHero({ tenantName, logoUrl, title, subtitle, imageUrl, showcase, primary, secondary }: StoreHeroProps) {
  const [lead, ...rest] = showcase;
  const hasVisual = Boolean(imageUrl) || showcase.length > 0;

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] bg-accent text-accent-foreground sm:rounded-[36px]">
      <span aria-hidden className="absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-accent-foreground/10 sm:h-[28rem] sm:w-[28rem]" />
      <span aria-hidden className="absolute -bottom-32 -left-20 -z-10 h-72 w-72 rounded-full bg-black/10" />

      <div className={`grid gap-8 px-5 pb-6 pt-8 sm:px-10 sm:pb-10 sm:pt-12 lg:gap-12 lg:px-14 lg:py-16 ${hasVisual ? "lg:grid-cols-[1fr_1.05fr] lg:items-center" : "text-center"}`}>
        <div className={hasVisual ? "" : "mx-auto max-w-3xl"}>
          <p className={`inline-flex items-center gap-2 rounded-full bg-accent-foreground/12 py-1.5 pl-1.5 pr-3.5 text-sm font-semibold ${hasVisual ? "" : "mx-auto"}`}>
            <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white">
              {logoUrl ? (
                <Image src={logoUrl} alt="" fill sizes="28px" className="object-contain" />
              ) : (
                <Store className="h-4 w-4 text-neutral-900" aria-hidden />
              )}
            </span>
            {tenantName}
          </p>
          <h1
            className={`mt-5 text-[40px] font-extrabold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[68px] ${storeDisplayFont}`}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className={`mt-4 max-w-xl text-base leading-relaxed text-accent-foreground/85 sm:text-lg ${hasVisual ? "" : "mx-auto"}`}>
              {subtitle}
            </p>
          ) : null}
          <div className={`mt-7 flex flex-col gap-3 sm:flex-row ${hasVisual ? "" : "sm:justify-center"}`}>
            <Link href={primary.href} className={PRIMARY}>
              {primary.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {secondary ? (
              <Link href={secondary.href} className={SECONDARY}>
                {secondary.label}
              </Link>
            ) : null}
          </div>
        </div>

        {imageUrl ? (
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl shadow-2xl shadow-black/25 ring-1 ring-white/20 sm:rounded-3xl">
            <Image
              src={imageUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ) : lead ? (
          <div
            className={`grid h-64 gap-3 sm:h-96 lg:h-[440px] ${
              rest.length > 0 ? "grid-cols-[1.35fr_1fr] grid-rows-2" : "grid-cols-1"
            }`}
          >
            <div className={rest.length > 0 ? "row-span-2" : ""}>
              <ShowcaseCard item={lead} large priority />
            </div>
            {rest.slice(0, 2).map((item, index) => (
              <div key={item.id} className={rest.length === 1 ? "row-span-2" : ""}>
                <ShowcaseCard item={item} priority={index === 0} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
