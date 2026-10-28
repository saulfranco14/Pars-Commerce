import { apiFetch } from "@/services/apiFetch";
import { leadFiltersQuery } from "@/features/growth/helpers/leadFiltersQuery";

import type { GrowthLead, LeadFilters, LeadOutcome } from "@/features/growth/interfaces/lead";
import type { GrowthMailbox, GrowthSettings, GrowthSettingsPatch, MailboxInput } from "@/features/growth/interfaces/settings";
import type { GrowthTemplate, TemplateDraft, TemplatePreview, TemplateVariant } from "@/features/growth/interfaces/template";
import type { SweepBatch, SweepFilters } from "@/features/growth/interfaces/sweep";
import type { WhatsappDraft, WhatsappStep } from "@/features/growth/interfaces/whatsapp";

const BASE = "/api/platform/growth";

export function leadsKey(filters: LeadFilters): string {
  return `${BASE}/leads?${leadFiltersQuery(filters)}`;
}

export const leadKey = (id: string) => `${BASE}/leads/${id}`;
/** Every filtered list page, so an action on one prospect refreshes whichever list the operator goes back to. */
export const isLeadsListKey = (key: unknown) => typeof key === "string" && key.startsWith(`${BASE}/leads?`);
export const engineKey = `${BASE}/settings`;
export const templatesKey = `${BASE}/templates`;
export const funnelKey = (days: number) => `${BASE}/funnel?days=${days}`;

export async function patchLead(id: string, body: { outcome?: LeadOutcome; reason?: string; snoozeDays?: number | null; phone?: string; giro?: string; skip?: boolean }): Promise<GrowthLead> {
  return (await apiFetch(leadKey(id), { method: "PATCH", body: JSON.stringify(body) })) as GrowthLead;
}

export async function saveSettings(patch: GrowthSettingsPatch): Promise<GrowthSettings> {
  return (await apiFetch(engineKey, { method: "PATCH", body: JSON.stringify(patch) })) as GrowthSettings;
}

export async function createMailbox(input: MailboxInput): Promise<GrowthMailbox> {
  return (await apiFetch(`${BASE}/mailboxes`, { method: "POST", body: JSON.stringify(input) })) as GrowthMailbox;
}

export async function updateMailbox(id: string, patch: { is_active?: boolean; daily_cap?: number }): Promise<GrowthMailbox> {
  return (await apiFetch(`${BASE}/mailboxes/${id}`, { method: "PATCH", body: JSON.stringify(patch) })) as GrowthMailbox;
}

export async function testMailbox(id: string): Promise<{ smtp: string; imap: string }> {
  return (await apiFetch(`${BASE}/mailboxes/${id}/test`, { method: "POST" })) as { smtp: string; imap: string };
}

export async function saveTemplate(draft: TemplateDraft): Promise<GrowthTemplate> {
  return (await apiFetch(templatesKey, { method: "POST", body: JSON.stringify(draft) })) as GrowthTemplate;
}

export async function setTemplateStatus(id: string, status: "active" | "paused"): Promise<GrowthTemplate> {
  return (await apiFetch(`${templatesKey}/${id}`, { method: "PATCH", body: JSON.stringify({ status }) })) as GrowthTemplate;
}

export async function previewTemplate(draft: TemplateDraft): Promise<TemplatePreview> {
  return (await apiFetch(`${templatesKey}/preview`, { method: "POST", body: JSON.stringify(draft) })) as TemplatePreview;
}

export async function createTelegramLink(): Promise<{ code: string; deepLink: string | null; expiresAt: string }> {
  return (await apiFetch(`${BASE}/telegram/link`, { method: "POST" })) as { code: string; deepLink: string | null; expiresAt: string };
}

export async function connectTelegramWebhook(): Promise<{ url: string }> {
  return (await apiFetch(`${BASE}/telegram/setup`, { method: "POST" })) as { url: string };
}

export async function confirmUnsubscribe(token: string): Promise<void> {
  await apiFetch(`/api/growth/unsubscribe?t=${encodeURIComponent(token)}`, { method: "POST" });
}

export async function createWhatsappDraft(id: string, body: { step?: WhatsappStep; variant?: TemplateVariant }): Promise<WhatsappDraft> {
  return (await apiFetch(`${leadKey(id)}/whatsapp`, { method: "POST", body: JSON.stringify(body) })) as WhatsappDraft;
}

export async function fetchSweep(filters: SweepFilters, exclude: string[]): Promise<SweepBatch> {
  return (await apiFetch(`${BASE}/sweep`, { method: "POST", body: JSON.stringify({ ...filters, exclude }) })) as SweepBatch;
}
