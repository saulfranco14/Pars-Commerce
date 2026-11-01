import { createHash } from "node:crypto";

import { generateText, GeminiError } from "@/lib/ai/gemini";
import { createAdminClient } from "@/lib/supabase/admin";
import { listBillingPlans } from "@/features/billing/billingService";
import { questionKey } from "@/features/growth/helpers/questionKey";
import { buildTodayPlan } from "@/features/growth/helpers/todayPlan";
import { buildAskPrompt, buildTodayPrompt, finishAiText, finishAnswer, isUnknownAnswer } from "@/features/growth/helpers/tlacoAiPrompt";
import { buildKnowledge, frequentAnswer } from "@/features/growth/helpers/tlacoKnowledge";
import { FREQUENT_QUESTIONS, TODAY_AI_WAIT_MS, UNKNOWN_ANSWER } from "@/features/growth/constants/tlacoAi";

import type { GenerateOptions } from "@/lib/ai/gemini";
import type { BillingPlan } from "@/features/billing/entitlements";
import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { GrowthActor } from "@/features/growth/interfaces/member";
import type { AskTlacoInput, TlacoAnswer, TodayFacts, TodayPlanText } from "@/features/growth/interfaces/tlacoAi";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const TODAY_AI: GenerateOptions = { thinkingLevel: "minimal", maxOutputTokens: 300 };
const ANSWER_AI: GenerateOptions = { thinkingLevel: "minimal", maxOutputTokens: 350 };

async function activePlans(): Promise<BillingPlan[]> {
  try {
    return await listBillingPlans(createAdminClient());
  } catch (error) {
    console.error("[growth] Tlaco IA could not read billing plans", error);
    return [];
  }
}

/** The day's plan in Tlaco IA's words; when the AI fails or is slow, the rules' own text, so the card is never stuck. */
export async function writeTodayPlan(facts: TodayFacts, now: Date = new Date()): Promise<ServiceResult<TodayPlanText>> {
  const plan = buildTodayPlan(facts, now);
  if (!plan.steps.length) return { ok: true, data: { text: plan.text, source: "rules" } };
  try {
    const { system, prompt } = buildTodayPrompt(plan, facts);
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve(""), TODAY_AI_WAIT_MS));
    const text = finishAiText(await Promise.race([generateText(system, prompt, TODAY_AI), slow]));
    return { ok: true, data: text ? { text, source: "ai" } : { text: plan.text, source: "rules" } };
  } catch (error) {
    console.error("[growth] Tlaco IA today plan failed", error);
    return { ok: true, data: { text: plan.text, source: "rules" } };
  }
}

/** Cache misses and storage errors never block an answer; they only cost one more AI call. */
async function cachedAnswer(db: GrowthDb, key: string, version: string): Promise<Pick<TlacoAnswer, "answer" | "source"> | null> {
  const { data, error } = await db.from("growth_ai_answers").select("answer, source").eq("question_key", key).eq("knowledge_version", version).maybeSingle();
  if (error) {
    console.error("[growth] Tlaco IA cache read failed", error.message);
    return null;
  }
  if (!data) return null;
  db.rpc("growth_ai_answer_hit", { p_question_key: key, p_knowledge_version: version }).then(({ error: hitError }: { error: { message: string } | null }) => {
    if (hitError) console.error("[growth] Tlaco IA cache hit failed", hitError.message);
  });
  return data as Pick<TlacoAnswer, "answer" | "source">;
}

async function saveAnswer(db: GrowthDb, key: string, version: string, answer: TlacoAnswer): Promise<void> {
  const { error } = await db
    .from("growth_ai_answers")
    .upsert({ question_key: key, knowledge_version: version, question: answer.question, answer: answer.answer, source: answer.source }, { onConflict: "question_key,knowledge_version" });
  if (error) console.error("[growth] Tlaco IA cache write failed", error.message);
}

/**
 * One question, one answer, only from what the platform says about itself. Frequent questions skip the AI,
 * and any question already answered with the same knowledge comes from the shared cache.
 */
export async function askTlaco(db: GrowthDb, actor: GrowthActor, input: AskTlacoInput): Promise<ServiceResult<TlacoAnswer>> {
  if (actor.tenantId) return { ok: false, error: { code: "forbidden", message: "Las dudas sobre Tlaco sólo están en el espacio de Tlaco." } };
  const plans = await activePlans();
  const frequent = FREQUENT_QUESTIONS.find((item) => item.id === input.id);
  if (frequent) {
    if (frequent.id === "precio" && !plans.length) return { ok: false, error: { code: "internal", message: "No pudimos leer los planes. Intenta de nuevo." } };
    return { ok: true, data: { question: frequent.question, ...frequentAnswer(frequent.id, plans) } };
  }

  const knowledge = buildKnowledge(plans);
  const version = createHash("sha256").update(knowledge).digest("hex").slice(0, 12);
  const key = questionKey(input.question);
  const cached = key ? await cachedAnswer(db, key, version) : null;
  if (cached) return { ok: true, data: { question: input.question, ...cached } };

  try {
    const { system, prompt } = buildAskPrompt(knowledge, input.question);
    const raw = await generateText(system, prompt, ANSWER_AI);
    const answer: TlacoAnswer = isUnknownAnswer(raw)
      ? { question: input.question, answer: UNKNOWN_ANSWER, source: null }
      : { question: input.question, answer: finishAnswer(raw), source: "Lo que la plataforma dice de Tlaco" };
    if (key) await saveAnswer(db, key, version, answer);
    return { ok: true, data: answer };
  } catch (error) {
    console.error("[growth] Tlaco IA answer failed", error);
    const busy = !(error instanceof GeminiError) || error.status === 502;
    const message = busy ? "Tlaco IA tardó demasiado en contestar. Intenta de nuevo o toca una de las preguntas frecuentes." : error.message;
    return { ok: false, error: { code: error instanceof GeminiError && error.status === 500 ? "internal" : "validation", message } };
  }
}
