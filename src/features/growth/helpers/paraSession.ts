import { PARA_ITEM_NAME_MAX, PARA_PLACEMENT_LABEL, PARA_REPORTED_ITEMS, PARA_SECTION_LABEL } from "@/features/growth/constants/para";

import type { ParaAction, ParaPlacement, ParaSection, ParaSessionPayload } from "@/features/growth/interfaces/para";

const SECTIONS = Object.keys(PARA_SECTION_LABEL) as ParaSection[];
const PLACEMENTS = Object.keys(PARA_PLACEMENT_LABEL) as ParaPlacement[];

export type ParaOutcome = "claim" | "help" | "left";

export function parsePlacement(raw: unknown): ParaPlacement | null {
  return PLACEMENTS.includes(raw as ParaPlacement) ? (raw as ParaPlacement) : null;
}

function parseAction(raw: unknown): ParaAction | null {
  if (typeof raw !== "string") return null;
  const [kind, placement] = raw.split(":");
  return (kind === "claim" || kind === "help") && parsePlacement(placement) ? (raw as ParaAction) : null;
}

function list(raw: unknown): unknown[] {
  return Array.isArray(raw) ? raw : [];
}

/** The page is public, so the summary keeps only known ids and a few short product names. */
export function sanitizeParaSession(raw: unknown): ParaSessionPayload {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const seen = new Set(list(source.sections));
  const actions = list(source.actions).map(parseAction).filter((action): action is ParaAction => action !== null);
  const items = list(source.items)
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, PARA_ITEM_NAME_MAX))
    .filter(Boolean);
  return {
    sections: SECTIONS.filter((section) => seen.has(section)),
    actions: [...new Set(actions)],
    items: [...new Set(items)].slice(0, PARA_REPORTED_ITEMS),
  };
}

export function paraOutcome(payload: ParaSessionPayload): ParaOutcome {
  if (payload.actions.some((action) => action.startsWith("claim:"))) return "claim";
  if (payload.actions.some((action) => action.startsWith("help:"))) return "help";
  return "left";
}

export function formatVisitSeconds(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return `${total} s`;
  const rest = total % 60;
  return rest ? `${Math.floor(total / 60)} min ${rest} s` : `${Math.floor(total / 60)} min`;
}

function actionLabel(action: ParaAction): string {
  const [kind, placement] = action.split(":") as ["claim" | "help", ParaPlacement];
  return `${kind === "claim" ? "Activar" : "Ayuda por WhatsApp"} (${PARA_PLACEMENT_LABEL[placement]})`;
}

/** Plain-text pieces of a visit, shared by the Telegram alert and the lead timeline. */
export function describeParaSession(payload: ParaSessionPayload): { seen: string | null; tapped: string | null } {
  const seen = payload.sections.map((section) => PARA_SECTION_LABEL[section]);
  const tapped = [...payload.actions.map(actionLabel), ...payload.items];
  return {
    seen: seen.length === 0 ? null : seen.length === 1 ? `sólo ${seen[0]}` : seen.join(", "),
    tapped: tapped.length > 0 ? tapped.join(", ") : null,
  };
}

/** Suffix for a «Para ti» event in the lead timeline; empty for every other event. */
export function paraEventDetail(type: string, payload: Record<string, unknown>): string {
  if (type === "claim_clicked" || type === "help_clicked") {
    const placement = parsePlacement(payload.placement);
    return placement ? ` · ${PARA_PLACEMENT_LABEL[placement]}` : "";
  }
  if (type !== "para_left") return "";
  const { seen, tapped } = describeParaSession(sanitizeParaSession(payload));
  return `${seen ? ` · vio ${seen}` : ""}${tapped ? ` · tocó ${tapped}` : ""}`;
}
