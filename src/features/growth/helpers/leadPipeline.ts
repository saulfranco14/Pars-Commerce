import { OPEN_STAGES, PIPELINE_STEPS } from "@/features/growth/constants/leadPipeline";

import type { StageAction } from "@/features/growth/constants/leadPipeline";
import type { GrowthLead, LeadStage, NextStepDue } from "@/features/growth/interfaces/lead";

const TIME_ZONE = "America/Mexico_City";

/** Position in the six-step pipeline; side exits (sin respuesta, descartado) return -1. */
export function pipelineIndex(stage: LeadStage): number {
  return PIPELINE_STEPS.findIndex((step) => step.stages.includes(stage));
}

function dayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

/** Whole calendar days between two instants, counted in Mexico City. */
export function calendarDaysBetween(from: Date, to: Date): number {
  return Math.round((Date.parse(dayKey(to)) - Date.parse(dayKey(from))) / 86_400_000);
}

export function formatDayTime(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { timeZone: TIME_ZONE, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

type DueLead = Pick<GrowthLead, "stage" | "next_step" | "next_step_at" | "whatsapp_attempts" | "appointment_at">;

function stepLabel(lead: DueLead): string {
  if (lead.next_step === "retomar") return "Retomar";
  if (lead.stage === "cita") return "Visita";
  if (lead.next_step === "visita") return "Visitar o esperar";
  if (lead.stage === "caliente") return "Escríbele: vio su tienda";
  if (lead.stage === "conversando") return "Contestar o agendar cita";
  return "Mandar seguimiento";
}

/** What to do next and how urgent it is: red when overdue, amber for today. */
export function nextStepDue(lead: DueLead, now: Date = new Date()): NextStepDue | null {
  if (!lead.next_step_at) return null;
  const at = new Date(lead.next_step_at);
  const days = calendarDaysBetween(now, at);
  const label = stepLabel(lead);
  if (lead.stage === "cita") {
    return { label, when: formatDayTime(lead.appointment_at ?? lead.next_step_at), tone: days < 0 ? "danger" : days === 0 ? "warning" : "neutral" };
  }
  if (days < 0) return { label, when: days === -1 ? "venció ayer" : `venció hace ${-days} días`, tone: "danger" };
  if (days === 0) return { label, when: "hoy", tone: "warning" };
  if (days === 1) return { label, when: "mañana", tone: "neutral" };
  return { label, when: `en ${days} días`, tone: "neutral" };
}

/** Mirror of growth_follow_up's checks, so the screen only offers moves the database accepts. */
export function canFollowUp(lead: Pick<GrowthLead, "stage" | "snoozed_until">, action: StageAction, now: Date = new Date()): boolean {
  const open = OPEN_STAGES.includes(lead.stage);
  switch (action) {
    case "schedule_visit":
      return open && lead.stage !== "cita";
    case "reschedule_visit":
    case "cancel_visit":
      return lead.stage === "cita";
    case "resume":
      return open && Boolean(lead.snoozed_until && new Date(lead.snoozed_until) > now);
    case "replied":
      return ["contactado", "caliente", "sin_respuesta"].includes(lead.stage);
    case "note":
      return true;
    default:
      return open;
  }
}

/** ISO date `days` after today at the given hour in Mexico City (UTC-6, no DST since 2022). */
export function daysFromToday(days: number, hour = 10, now: Date = new Date()): string {
  const day = new Date(Date.parse(dayKey(now)) + days * 86_400_000).toISOString().slice(0, 10);
  return new Date(`${day}T${String(hour).padStart(2, "0")}:00:00-06:00`).toISOString();
}

/** A date and time picked in the sheet, read as Mexico City time. */
export function mexicoInputToIso(date: string, time: string): string {
  return new Date(`${date}T${time || "10:00"}:00-06:00`).toISOString();
}

export function todayInputValue(now: Date = new Date()): string {
  return dayKey(now);
}
