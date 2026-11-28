"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarCheck, MapPin, MessageSquareReply } from "lucide-react";

import { useTelegramWebApp } from "@/features/growth/hooks/useTelegramWebApp";
import { TlacoLogo } from "@/components/brand/TlacoLogo";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { Notification } from "@/components/ui/Notification";
import { MiniAppNumbers } from "@/features/growth/components/miniapp/MiniAppNumbers";
import { MiniAppReplies } from "@/features/growth/components/miniapp/MiniAppReplies";
import { MiniAppRoute } from "@/features/growth/components/miniapp/MiniAppRoute";
import { MiniAppToday } from "@/features/growth/components/miniapp/MiniAppToday";

import { MINI_APP_TABS } from "@/features/growth/constants/miniApp";
import { miniAppClient } from "@/features/growth/services/miniAppClient";

type Tab = (typeof MINI_APP_TABS)[number]["key"];

const TAB_ICON: Record<Tab, typeof CalendarCheck> = { hoy: CalendarCheck, respuestas: MessageSquareReply, ruta: MapPin, numeros: BarChart3 };

/** Tlaco Ventas inside Telegram: the bot alerts, the app holds the day's cards, replies, route and numbers. */
export function MiniAppView() {
  const telegram = useTelegramWebApp();
  const [tab, setTab] = useState<Tab>("hoy");
  const client = useMemo(() => (telegram.initData ? miniAppClient(telegram.initData) : null), [telegram.initData]);

  if (telegram.outside) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md content-center gap-4 px-5">
        <TlacoLogo size="md" />
        <Notification tone="info" message="Esta app se abre desde el bot de Tlaco en Telegram: toca el botón «Abrir app» del chat." />
      </main>
    );
  }
  if (!client) return <LoadingBlock message="Abriendo…" />;

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex min-h-14 items-center justify-between border-b border-border-soft bg-surface px-4">
        <TlacoLogo size="sm" />
        <span className="text-sm font-bold text-foreground">{MINI_APP_TABS.find((item) => item.key === tab)?.label}</span>
      </header>
      <main className="min-w-0 flex-1 px-3 pb-24 pt-3">
        {tab === "hoy" ? <MiniAppToday client={client} native={telegram} /> : null}
        {tab === "respuestas" ? <MiniAppReplies client={client} openExternal={telegram.openExternal} /> : null}
        {tab === "ruta" ? <MiniAppRoute client={client} openExternal={telegram.openExternal} /> : null}
        {tab === "numeros" ? <MiniAppNumbers client={client} /> : null}
      </main>
      <nav aria-label="Secciones" className="fixed inset-x-0 bottom-0 grid grid-cols-4 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
        {MINI_APP_TABS.map((item) => {
          const Icon = TAB_ICON[item.key];
          const active = tab === item.key;
          return (
            <button key={item.key} type="button" aria-current={active ? "page" : undefined} onClick={() => setTab(item.key)} className={`grid min-h-14 cursor-pointer justify-items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? "text-accent" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
