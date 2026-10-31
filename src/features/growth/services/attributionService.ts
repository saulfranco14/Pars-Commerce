import { hashPreviewToken } from "@/features/preview/previewLinks";
import { growthDb, isGrowthEnabled } from "@/features/growth/services/growthDb";
import { leadAlertTarget, notifyOperators } from "@/features/growth/services/operatorService";
import { escapeHtml } from "@/features/growth/services/telegramApi";

const BUCKET_LABEL: Record<string, string> = { engine: "motor", assisted: "asistido", self: "solo" };
const CHANNEL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", visita: "visita", correo: "correo", para: "link", declarado: "dijo que lo contactaste" };

interface AttributionInput {
  tenantId: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  prospectToken?: string | null;
  heardFrom?: string | null;
  utm?: Record<string, string>;
}

/**
 * Records where a new tenant came from. Called after the tenant exists; it
 * never throws, so a growth failure can't break a registration.
 */
export async function attributeRegistration(admin: unknown, input: AttributionInput): Promise<void> {
  try {
    const db = growthDb(admin);
    const token = input.prospectToken?.trim();
    const { data, error } = await db.rpc("growth_link_registration", {
      p_tenant_id: input.tenantId,
      p_email: input.email,
      p_phone: input.phone,
      p_token_hash: token && token.length >= 32 ? hashPreviewToken(token) : null,
      p_heard_from: input.heardFrom?.slice(0, 40) || null,
      p_utm: input.utm ?? {},
    });
    if (error) {
      console.error("[growth] attribution failed:", error.message);
      return;
    }
    if (!isGrowthEnabled()) return;
    const row = (Array.isArray(data) ? data[0] : data) as { bucket: string; lead_id: string | null; channel: string | null } | undefined;
    const bucket = BUCKET_LABEL[row?.bucket ?? "self"] ?? "solo";
    const channel = row?.channel ? ` · ${CHANNEL_LABEL[row.channel] ?? row.channel}` : "";
    await notifyOperators(db, { text: `<b>Registro nuevo</b> · ${bucket}${channel}\n${escapeHtml(input.businessName)}` }, await leadAlertTarget(db, row?.lead_id));
  } catch (error) {
    console.error("[growth] attribution error:", error);
  }
}
