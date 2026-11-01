import { describe, expect, it } from "vitest";

import { followUpListCounts, followUpListLeads } from "@/features/growth/helpers/followUpList";

import type { GrowthLead, LeadBoard, PipelineCounts } from "@/features/growth/interfaces/lead";

const lead = (id: string, stage: GrowthLead["stage"]) => ({ id, stage, next_step_at: null }) as unknown as GrowthLead;

const board: LeadBoard = {
  columns: [
    { key: "contactado", total: 64, leads: [lead("a", "contactado")] },
    { key: "caliente", total: 9, leads: [lead("b", "caliente")] },
    { key: "conversando", total: 1, leads: [] },
    { key: "cita", total: 2, leads: [] },
    { key: "registrado", total: 4, leads: [] },
  ],
  counts: { due_today: 39, overdue: 21 } as PipelineCounts,
  due: [lead("b", "caliente"), lead("a", "contactado")],
};

describe("follow-up lists", () => {
  it("«Para hoy» counts every due lead, not only the loaded columns", () => {
    expect(followUpListCounts(board, false)).toMatchObject({ hoy: 39, todos: 80, contactado: 64, caliente: 9 });
    expect(followUpListLeads(board, "hoy").map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("a search counts what it found", () => {
    expect(followUpListCounts(board, true).hoy).toBe(2);
  });
});
