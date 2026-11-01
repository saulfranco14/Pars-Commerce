import { DAY_END_HOUR, DAY_START_HOUR, WRITE_WINDOWS } from "@/features/growth/constants/tlacoAi";

import type { TodayFacts, TodayPlan, TodayStep } from "@/features/growth/interfaces/tlacoAi";

const TIME_ZONE = "America/Mexico_City";
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Weekday (0 = Sunday) and hour with minutes as a fraction, in Mexico City. */
export function mexicoClock(now: Date): { weekday: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  return { weekday: SHORT_DAYS.indexOf(get("weekday")), hour: Number(get("hour")) + Number(get("minute")) / 60 };
}

function inWindow(weekday: number, hour: number): boolean {
  return WRITE_WINDOWS[weekday].some(([start, end]) => hour >= start && hour < end);
}

function atHour(hour: number): string {
  if (hour < 12) return `a las ${hour}`;
  return `a las ${hour === 12 ? 12 : hour - 12} de la tarde`;
}

/** Next time writing to a business is a good idea: «a las 4 de la tarde», «mañana a las 10», «el lunes a las 10». */
export function nextWriteTime(weekday: number, hour: number): string {
  for (let ahead = 0; ahead < 8; ahead++) {
    const day = (weekday + ahead) % 7;
    const start = WRITE_WINDOWS[day].map(([from]) => from).find((from) => ahead > 0 || from > hour);
    if (start === undefined) continue;
    if (ahead === 0) return atHour(start);
    return `${ahead === 1 ? "mañana" : `el ${WEEKDAYS[day]}`} ${atHour(start)}`;
  }
  return "el lunes a las 10";
}

function introFor(weekday: number, hour: number, writeNow: boolean): string {
  if (hour >= DAY_END_HOUR) return "Ya es tarde para escribirle a un negocio.";
  if (hour < DAY_START_HOUR) return "Todavía es temprano para escribirle a un negocio.";
  if (writeNow) return "Buen momento para escribir: los negocios están revisando el celular.";
  if (weekday === 0) return "Hoy es domingo y muchos negocios descansan: no mandes primeros mensajes ni seguimientos.";
  if (weekday === 6) return hour < 10 ? "Los negocios están abriendo." : "Es sábado por la tarde y muchos negocios están en su hora más fuerte.";
  if (hour < 10) return "Los negocios están abriendo.";
  if (hour < 16) return "Es hora de comida y muchos negocios están ocupados.";
  return "Los negocios están cerrando.";
}

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many.replace("{n}", count.toLocaleString("es-MX")));

/** «Tu día» turned into what to do now and what to leave for later, by weekday and hour; the AI only rewrites it. */
export function buildTodayPlan(facts: TodayFacts, now: Date = new Date()): TodayPlan {
  const { weekday, hour } = mexicoClock(now);
  const writeNow = inWindow(weekday, hour);
  const dayOpen = hour >= DAY_START_HOUR && hour < DAY_END_HOUR;
  const later = writeNow ? null : nextWriteTime(weekday, hour);
  const tomorrow = hour >= DAY_END_HOUR ? "mañana temprano" : `a las ${DAY_START_HOUR}`;
  const followUps = Math.max(0, facts.dueToday - facts.replied - facts.hot);
  const firstLeft = Math.max(0, facts.dailyGoal - facts.sentToday);

  const steps: TodayStep[] = [];
  if (facts.replied) {
    steps.push({
      action: "replied",
      title: facts.replied === 1 && facts.repliedName ? `Contesta a ${facts.repliedName}` : plural(facts.replied, "Contesta al que respondió", "Contesta a los {n} que respondieron"),
      detail: "Te escribió y espera respuesta",
      when: dayOpen ? null : tomorrow,
      button: "Contestar",
    });
  }
  if (facts.visitsToday && hour < DAY_END_HOUR) {
    steps.push({ action: "visits", title: plural(facts.visitsToday, "Tienes 1 visita hoy", "Tienes {n} visitas hoy"), detail: "Revisa la dirección antes de salir", when: null, button: "Ver visitas" });
  }
  if (facts.hot) {
    steps.push({ action: "hot", title: plural(facts.hot, "Escribe al que abrió su tienda", "Escribe a los {n} que abrieron su tienda"), detail: "Abrieron tu enlace: es cuando más contestan", when: later, button: "Escribirles" });
  }
  if (followUps) {
    steps.push({
      action: "follow_up",
      title: plural(followUps, "Manda el seguimiento que te toca", "Manda los {n} seguimientos que te tocan"),
      detail: facts.overdue ? `${plural(facts.overdue, "1 ya venció", "{n} ya vencieron")}: los más atrasados primero` : "Les toca hoy",
      when: later,
      button: "Empezar",
    });
  }
  if (facts.cold) {
    steps.push({ action: "cold", title: plural(facts.cold, "Limpia al que no abrió", "Limpia los {n} que no abrieron"), detail: "No abrieron en 3 días. Son unos minutos", when: dayOpen || hour >= DAY_END_HOUR ? null : tomorrow, button: "Limpiar" });
  }
  if (firstLeft) {
    steps.push({
      action: "first",
      title: facts.sentToday ? plural(firstLeft, "Te falta 1 primer mensaje", "Te faltan {n} primeros mensajes") : plural(firstLeft, "Manda tu primer mensaje", "Manda tus {n} primeros mensajes"),
      detail: `Llevas ${facts.sentToday} de ${facts.dailyGoal} hoy`,
      when: later,
      button: "Barrido",
    });
  }
  steps.sort((a, b) => Number(a.when !== null) - Number(b.when !== null));

  const intro = introFor(weekday, hour, writeNow);
  const sentences = steps.slice(0, 3).map((step) => (step.when ? `${step.title} ${step.when}.` : `${step.title}.`));
  const text = [intro, ...(sentences.length ? sentences : ["No tienes pendientes por ahora."])].join(" ");
  const bucket = (value: number, size: number) => Math.ceil(value / size);
  const signature = [
    intro,
    steps.map((step) => `${step.action}${step.when ? "~" : ""}`).join(","),
    facts.replied,
    facts.repliedName ?? "",
    facts.hot,
    facts.visitsToday,
    bucket(facts.overdue, 10),
    bucket(followUps, 10),
    bucket(facts.cold, 10),
    bucket(firstLeft, 5),
  ].join("|");

  return { intro, steps, text, signature };
}
