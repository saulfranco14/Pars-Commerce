import { createHash } from "crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { legalProfileSchema, type LegalProfileForm } from "@/features/legal/legalProfileSchema";

type Admin = {
  from: (table: string) => any;
  storage: { from: (bucket: string) => { upload: (path: string, body: Uint8Array, options: Record<string, unknown>) => Promise<{ error: { message: string } | null }> } };
};

export const REQUIRED_TLACO_DOCUMENTS = [
  "saas_terms",
  "privacy_notice",
  "data_processing",
  "exit_policy",
] as const;

export const LEGAL_REPRESENTATION_DECLARATION =
  "Acepto el acuerdo de Tlaco y declaro que puedo representar este negocio.";

export type LegalPartyInput = Omit<
  LegalProfileForm,
  | "tax_id"
  | "address_line2"
  | "city"
  | "state"
  | "postal_code"
  | "contractual_email"
  | "representative_name"
  | "representative_role"
  | "public_seller_name"
  | "public_privacy_contact"
> & {
  tax_id?: string | null;
  address_line2?: string;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  contractual_email?: string | null;
  representative_name?: string;
  representative_role?: string;
  public_seller_name?: string | null;
  public_privacy_contact?: string | null;
};

export function asLegalAdmin(client: unknown): Admin {
  return client as Admin;
}

export function documentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** Existing businesses keep operating until this server-side rollout date. */
export function shouldEnforceExistingLegalActivation(now = Date.now()): boolean {
  const rolloutDate = process.env.LEGAL_EXISTING_ENFORCEMENT_AT;
  if (!rolloutDate) return false;
  const parsed = Date.parse(rolloutDate);
  return Number.isFinite(parsed) && parsed <= now;
}

export function cleanLegalProfile(input: unknown): LegalPartyInput | null {
  const parsed = legalProfileSchema.safeParse(input);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    tax_id: parsed.data.tax_id || null,
    address_line2: parsed.data.address_line2 || undefined,
    city: parsed.data.city || null,
    state: parsed.data.state || null,
    postal_code: parsed.data.postal_code || null,
    representative_name: parsed.data.representative_name || undefined,
    representative_role: parsed.data.representative_role || undefined,
    contractual_email: parsed.data.contractual_email.toLowerCase() || null,
    contractual_phone: parsed.data.contractual_phone.replace(/[\s()-]/g, ""),
    public_seller_name: parsed.data.public_seller_name || null,
    public_privacy_contact: parsed.data.public_privacy_contact.trim() || null,
  };
}

export async function getOwnerMembership(admin: Admin, tenantId: string, userId: string) {
  const { data } = await admin
    .from("tenant_memberships")
    .select("status, role:tenant_roles(name)")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();
  const role = Array.isArray(data?.role) ? data.role[0] : data?.role;
  return Boolean(data && data.status === "active" && role?.name === "owner");
}

export async function getPublishedTlacoDocuments(admin: Admin) {
  const { data, error } = await admin
    .from("legal_document_versions")
    .select("id, document_type, version, title, content, content_hash, effective_at")
    .is("tenant_id", null)
    .eq("status", "published")
    .in("document_type", [...REQUIRED_TLACO_DOCUMENTS])
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  const byType = new Map<string, any>();
  for (const item of data ?? []) if (!byType.has(item.document_type)) byType.set(item.document_type, item);
  const docs = REQUIRED_TLACO_DOCUMENTS.map((type) => byType.get(type)).filter(Boolean);
  if (docs.length !== REQUIRED_TLACO_DOCUMENTS.length) throw new Error("Faltan documentos legales publicados.");
  return docs;
}

export async function hasTenantLegalAcceptance(admin: Admin, tenantId: string) {
  const { data } = await admin
    .from("tenant_legal_acceptances")
    .select("id, accepted_at, evidence_path, document_snapshot")
    .eq("tenant_id", tenantId)
    .order("accepted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const currentDocuments = await getPublishedTlacoDocuments(admin);
  const acceptedDocuments = Array.isArray(data.document_snapshot) ? data.document_snapshot : [];
  const isCurrent = currentDocuments.every((document: any) => acceptedDocuments.some((accepted: any) =>
    accepted.id === document.id && accepted.content_hash === document.content_hash,
  ));
  return isCurrent ? data : null;
}

export async function getTenantPurchaseDocuments(admin: Admin, tenantId: string) {
  const { data: profile, error } = await admin
    .from("tenant_legal_profiles")
    .select("public_seller_name, public_privacy_contact, legal_name, updated_at")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  let sellerName = profile?.public_seller_name;
  let privacyContact = profile?.public_privacy_contact;
  if (!sellerName || !privacyContact) {
    const { data: tenant } = await admin.from("tenants").select("name, whatsapp_phone").eq("id", tenantId).maybeSingle();
    sellerName = tenant?.name ?? "Este negocio";
    privacyContact = tenant?.whatsapp_phone ?? "el canal de atención del negocio";
  }
  const version = profile?.updated_at
    ? `merchant-${new Date(profile.updated_at).toISOString().slice(0, 10)}`
    : "merchant-1";
  const termsContent = `${sellerName} vende y atiende directamente los pedidos. Revisa el total antes de confirmar y usa el canal del negocio para atención, cambios o devoluciones.`;
  const privacyContent = `${sellerName} usa tus datos de contacto para atender este pedido. Para dudas sobre privacidad, escribe a ${privacyContact}.`;
  return [
    { type: "merchant_terms", title: `Condiciones de compra de ${sellerName}`, version, content: termsContent, content_hash: documentHash(termsContent) },
    { type: "merchant_privacy", title: `Aviso de privacidad de ${sellerName}`, version, content: privacyContent, content_hash: documentHash(privacyContent) },
  ];
}

function pdfLine(text: string) {
  return text.length > 104 ? `${text.slice(0, 101)}…` : text;
}

function wrapPdfText(text: string, max = 92) {
  return text.split("\n").flatMap((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length <= max) line = next;
      else { if (line) lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  });
}

/** Private, branded rendering of the immutable legal version. */
export async function createLetterheadDocumentPdf(document: { id: string; title: string; version: string; content: string; effective_at?: string | null }) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 790;
  const write = (value: string, size = 10, emphasis = false) => {
    if (y < 56) { page.drawText("Tlaco · Documento legal", { x: 48, y: 34, size: 8, font: regular, color: rgb(0.35, 0.42, 0.53) }); page = pdf.addPage([595, 842]); y = 790; }
    page.drawText(value, { x: 48, y, size, font: emphasis ? bold : regular, color: rgb(0.06, 0.11, 0.2) });
    y -= size + 7;
  };
  page.drawRectangle({ x: 48, y: 798, width: 499, height: 3, color: rgb(0.2, 0.51, 0.98) });
  write("TLACO", 22, true);
  write("Plataforma para negocios · Documento legal", 9);
  y -= 8;
  write(document.title, 15, true);
  write(`Versión: ${document.version}`, 9);
  write(`Fecha de vigencia: ${document.effective_at ? new Date(document.effective_at).toLocaleDateString("es-MX") : "Pendiente de publicación"}`, 9);
  write(`Folio: ${document.id}`, 9);
  y -= 10;
  for (const line of wrapPdfText(document.content)) write(line, 10);
  page.drawText("Tlaco · Versión inmutable del documento", { x: 48, y: 34, size: 8, font: regular, color: rgb(0.35, 0.42, 0.53) });
  return new Uint8Array(await pdf.save());
}

export async function createAcceptancePdf(input: {
  acceptanceId: string;
  tenantName: string;
  profile: LegalPartyInput;
  documents: Array<{ title: string; version: string; content_hash: string }>;
  acceptedAt: string;
}) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 790;
  const write = (value: string, size = 10, emphasis = false) => {
    if (y < 56) { page = pdf.addPage([595, 842]); y = 790; }
    page.drawText(pdfLine(value, 104), { x: 48, y, size, font: emphasis ? bold : regular, color: rgb(0.06, 0.11, 0.2) });
    y -= size + 8;
  };
  page.drawRectangle({ x: 48, y: 798, width: 499, height: 3, color: rgb(0.2, 0.51, 0.98) });
  write("TLACO", 22, true);
  write("Comprobante de apertura y aceptación", 15, true);
  write(`Folio: ${input.acceptanceId}`, 9);
  write(`Fecha: ${new Date(input.acceptedAt).toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}`, 9);
  y -= 10;
  write(`Negocio: ${input.tenantName}`, 11, true);
  write(`Contratante: ${input.profile.legal_name}`, 10);
  write(`RFC: ${input.profile.tax_id ?? "Pendiente"}`, 10);
  write(`Contacto contractual: ${input.profile.contractual_email ?? "Pendiente"}`, 10);
  if (input.profile.representative_name) write(`Representante: ${input.profile.representative_name} · ${input.profile.representative_role ?? ""}`, 10);
  y -= 10;
  write("Documentos aceptados", 11, true);
  for (const document of input.documents) write(`• ${document.title} · versión ${document.version} · ${document.content_hash.slice(0, 12)}`, 9);
  y -= 10;
  write("La aceptación fue registrada desde una sesión autenticada del propietario. Este comprobante no es una certificación externa.", 9);
  page.drawText("Tlaco · Documento generado por la plataforma", { x: 48, y: 34, size: 8, font: regular, color: rgb(0.35, 0.42, 0.53) });
  return new Uint8Array(await pdf.save());
}
