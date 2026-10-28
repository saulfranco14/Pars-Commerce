"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

import { useParaObjection } from "@/features/growth/hooks/useParaObjection";
import { ParaVisitButton } from "@/features/growth/components/para/ParaVisitButton";

import { PARA_OBJECTIONS } from "@/features/growth/constants/para";

import type { ParaInteractiveProps } from "@/features/growth/interfaces/para";

/** «¿Qué le falta?»: the one place the owner tells us why, answered on the spot. */
export function ParaObjections({ token, data }: ParaInteractiveProps) {
  const { selected, choose } = useParaObjection({ token });
  const option = PARA_OBJECTIONS.find((entry) => entry.id === selected) ?? null;
  const who = data.sender?.firstName ?? "Alguien de Tlaco";
  const next = option?.next === "visit" && !data.visit ? "help" : option?.next;

  return (
    <section data-para-section="dudas" aria-labelledby="para-doubts-title" className="grid gap-4">
      <div className="grid gap-1">
        <h2 id="para-doubts-title" className="text-2xl font-bold tracking-tight text-(--store-ink) sm:text-3xl">
          ¿Qué le falta para activarla?
        </h2>
        <p className="text-[15px] text-(--store-ink-2)">Toque la que más se parezca a lo que piensa.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {PARA_OBJECTIONS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={selected === entry.id}
            onClick={() => choose(entry.id)}
            className={`min-h-11 rounded-full px-4 text-sm font-semibold ring-1 transition ${
              selected === entry.id ? "bg-(--store-ink) text-(--store-surface) ring-(--store-ink)" : "bg-(--store-surface) text-(--store-ink) ring-(--store-hairline) hover:bg-(--store-well)"
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {option ? (
        <div aria-live="polite" className="grid gap-4 rounded-(--store-radius) bg-(--store-surface) p-5 ring-1 ring-(--store-hairline)">
          <p className="text-[15px] leading-relaxed text-(--store-ink)">{option.answer(who)}</p>
          {next === "claim" ? (
            <Link
              href={data.claimUrl}
              data-para-action="claim:dudas"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-[15px] font-bold text-accent-foreground"
            >
              Activar mi tienda gratis
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : next === "visit" && data.visit ? (
            <ParaVisitButton token={token} offer={data.visit} placement="dudas" />
          ) : data.helpUrl ? (
            <a
              href={data.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-para-action="help:dudas"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-(--store-hairline) bg-(--store-surface) px-5 text-sm font-semibold text-(--store-ink) transition hover:bg-(--store-well)"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              {data.helpLabel}
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
