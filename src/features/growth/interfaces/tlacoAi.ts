import type { FollowUpList } from "@/features/growth/interfaces/lead";

export type TlacoAiTopic = "hoy" | "activar" | "tour";

export type TlacoAiPlacement = "card" | "floating";

/** What the person has today, as «Tu día» already shows it. */
export interface TodayFacts {
  dueToday: number;
  overdue: number;
  replied: number;
  hot: number;
  cold: number;
  sentToday: number;
  dailyGoal: number;
  visitsToday: number;
  /** Name of the one who replied, when it is just one. */
  repliedName: string | null;
}

export type TodayStepAction = "replied" | "visits" | "hot" | "follow_up" | "cold" | "first";

export interface TodayStep {
  action: TodayStepAction;
  title: string;
  detail: string;
  /** null: do it now; otherwise when it is a good time («mañana a las 10»). */
  when: string | null;
  button: string;
}

export interface TodayPlan {
  intro: string;
  steps: TodayStep[];
  /** Plain text from the rules; shown as is when the AI is not available. */
  text: string;
  /** Changes only when the plan really changes, so the AI text can be reused all day. */
  signature: string;
}

export interface TodayPlanText {
  text: string;
  source: "ai" | "rules";
}

export interface TodayPlanRequest extends TodayFacts {
  /** «Otra sugerencia»: skip what was saved and write it again. */
  fresh?: boolean;
}

export type FrequentQuestionId = "precio" | "comision" | "terminal" | "registro" | "giros" | "pagos" | "activo";

export interface FrequentQuestion {
  id: FrequentQuestionId;
  question: string;
}

export interface AskTlacoInput {
  question: string;
  id?: FrequentQuestionId;
}

export interface TlacoAnswer {
  question: string;
  answer: string;
  /** Where it comes from; null when Tlaco does not know. */
  source: string | null;
}

export interface TlacoAiCardProps {
  facts: TodayFacts | null;
  onStep: (action: TodayStepAction) => void;
}

export interface TlacoAiSheetProps {
  isOpen: boolean;
  /** Prospecting for Tlaco itself: the questions about Tlaco and its video make sense only there. */
  isTlaco: boolean;
  /** «Hoy» needs «Tu día»; the lead page opens the sheet without it. */
  withToday: boolean;
  topic: TlacoAiTopic;
  onTopic: (topic: TlacoAiTopic) => void;
  onClose: () => void;
  plan: TodayPlan | null;
  text: TodayPlanText | null;
  writing: boolean;
  onAgain: () => void;
  onStep: (action: TodayStepAction) => void;
}

export interface TlacoAiFabProps {
  visible: boolean;
  /** Said once a day, for a few seconds, the first time the button shows up. */
  teaser: string;
  onOpen: () => void;
}

export interface TlacoAiTodayTabProps {
  plan: TodayPlan | null;
  text: TodayPlanText | null;
  writing: boolean;
  onStep: (action: TodayStepAction) => void;
}

export interface TlacoAiAnswerProps {
  answer: TlacoAnswer | null;
  asking: string | null;
  error: string | null;
}

/** Where each «Tu día» step takes the person. */
export type TodayStepTarget = { list: FollowUpList } | { sheet: "cold" } | { path: string };
