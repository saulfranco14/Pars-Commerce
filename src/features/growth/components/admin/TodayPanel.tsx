"use client";

import Link from "next/link";
import { CalendarClock, Eye, MessageSquareReply, Send } from "lucide-react";

import { useGrowthMe } from "@/features/growth/hooks/useGrowthMe";
import { useMyDay } from "@/features/growth/hooks/useMyDay";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";

import { leadFiltersQuery } from "@/features/growth/helpers/leadFiltersQuery";
import { PROSPECTING_PATH, SWEEP_PATH } from "@/features/growth/constants/routes";

import type { LeadFilters } from "@/features/growth/interfaces/lead";

function listHref(filters: LeadFilters): string {
  return `${PROSPECTING_PATH}?${leadFiltersQuery({ vista: "contactar", owner: "me", ...filters })}`;
}

function greeting(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Mexico_City" }).format(now));
  return hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
}

/** «Tu día»: the three things to do today, in order, each with its own button. */
export function TodayPanel() {
  const { actor } = useGrowthMe();
  const { data } = useMyDay();
  if (!actor || !data) return null;

  const firstName = actor.displayName.split(" ")[0];
  const writeToday = data.hot_due + data.follow_ups_due;
  const progress = Math.min(100, Math.round((data.sent_today / Math.max(data.daily_goal, 1)) * 100));
  const tasks = [
    {
      icon: MessageSquareReply,
      title: "Contesta a quien respondió",
      detail: data.replied_due ? `${data.replied_due} ${data.replied_due === 1 ? "persona espera" : "personas esperan"} tu respuesta.` : "Nadie espera respuesta ahorita.",
      href: listHref({ stage: "conversando" }),
      cta: data.replied_due ? `Contestar a ${data.replied_due}` : "Ver",
      urgent: data.replied_due > 0,
    },
    {
      icon: Eye,
      title: "Escríbeles hoy",
      detail: writeToday
        ? `${data.hot_due ? `${data.hot_due} vieron su tienda` : ""}${data.hot_due && data.follow_ups_due ? " y " : ""}${data.follow_ups_due ? `${data.follow_ups_due} ${data.follow_ups_due === 1 ? "toca seguimiento" : "tocan seguimiento"}` : ""}. Te sugerimos qué mandarle a cada uno.`
        : "No tienes seguimientos para hoy.",
      href: listHref({ stage: "hoy" }),
      cta: writeToday ? `Empezar con ${writeToday}` : "Ver",
      urgent: writeToday > 0 && data.replied_due === 0,
    },
    {
      icon: Send,
      title: "Primeros mensajes de tu zona",
      detail: `Llevas ${data.sent_today} de ${data.daily_goal} hoy. Quedan ${data.first_messages_left.toLocaleString("es-MX")} por contactar.`,
      href: SWEEP_PATH,
      cta: data.sent_today ? "Seguir el barrido" : "Empezar el barrido",
      urgent: data.replied_due === 0 && writeToday === 0,
    },
  ];

  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-label="Tu día">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-foreground">{greeting(new Date())}, {firstName}</h2>
        <p className="text-sm text-muted-foreground">
          {data.overdue ? `${data.overdue} ${data.overdue === 1 ? "pendiente vencido" : "pendientes vencidos"} · ` : ""}Empieza por la primera.
        </p>
      </div>
      {data.visits_today ? (
        <Link href={listHref({ stage: "cita" })} className="inline-flex w-fit items-center gap-2 rounded-xl bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">
          <CalendarClock className="h-4 w-4" aria-hidden />Hoy tienes {data.visits_today === 1 ? "1 visita" : `${data.visits_today} visitas`}
        </Link>
      ) : null}
      <ol className="grid gap-3 md:grid-cols-3">
        {tasks.map((task, index) => (
          <li key={task.title} className="grid content-between gap-3 rounded-xl border border-border-soft bg-surface-raised/60 p-3">
            <div className="flex gap-3">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${task.urgent ? "bg-accent text-accent-foreground" : "bg-border-soft text-muted-foreground"}`}>{index + 1}</span>
              <div className="grid gap-0.5">
                <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground"><task.icon className="h-4 w-4 text-muted-foreground" aria-hidden />{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.detail}</p>
              </div>
            </div>
            {index === 2 ? (
              <div className="h-2 overflow-hidden rounded-full bg-border-soft" role="progressbar" aria-valuenow={data.sent_today} aria-valuemax={data.daily_goal} aria-label="Meta del día">
                <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
              </div>
            ) : null}
            <Link href={task.href} className={`${task.urgent ? adminActionButtonPrimary : adminActionButtonSecondary} w-full`}>{task.cta}</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
