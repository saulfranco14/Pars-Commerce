import { sortByUrgency } from "@/features/growth/helpers/leadPipeline";

import type { FollowUpList, GrowthLead, LeadBoard } from "@/features/growth/interfaces/lead";

/** The leads a follow-up list shows: «Para hoy» comes whole from the server, the rest from the board columns. */
export function followUpListLeads(board: LeadBoard, list: FollowUpList, now: Date = new Date()): GrowthLead[] {
  if (list === "hoy") return board.due;
  if (list === "todos") return sortByUrgency(board.columns.flatMap((column) => column.leads), now);
  return sortByUrgency(board.columns.find((column) => column.key === list)?.leads ?? [], now);
}

/** How many each list holds; a search knows nothing of the stage totals, so it counts what it found. */
export function followUpListCounts(board: LeadBoard, searching: boolean): Record<FollowUpList, number> {
  const column = (key: Exclude<FollowUpList, "hoy" | "todos">) => board.columns.find((item) => item.key === key)?.total ?? 0;
  const stages = {
    contactado: column("contactado"),
    caliente: column("caliente"),
    conversando: column("conversando"),
    cita: column("cita"),
    registrado: column("registrado"),
  };
  return {
    hoy: searching ? board.due.length : board.counts.due_today,
    todos: Object.values(stages).reduce((sum, value) => sum + value, 0),
    ...stages,
  };
}
