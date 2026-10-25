import { createHash } from "crypto";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { legalProfileSchema, type LegalProfileForm } from "@/features/legal/legalProfileSchema";
import { normalizeMexicanPhone } from "@/lib/phone";

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
  | "address_place_id"
  | "address_latitude"
  | "address_longitude"
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
  address_place_id?: string | null;
  address_latitude?: number | null;
  address_longitude?: number | null;
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
    address_place_id: parsed.data.address_place_id || null,
    address_latitude: parsed.data.address_latitude,
    address_longitude: parsed.data.address_longitude,
    city: parsed.data.city || null,
    state: parsed.data.state || null,
    postal_code: parsed.data.postal_code || null,
    representative_name: parsed.data.representative_name || undefined,
    representative_role: parsed.data.representative_role || undefined,
    contractual_email: parsed.data.contractual_email.toLowerCase() || null,
    contractual_phone: normalizeMexicanPhone(parsed.data.contractual_phone) as string,
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

const PDF_NAVY = rgb(0.03, 0.09, 0.18);
const PDF_BLUE = rgb(0.19, 0.49, 0.96);
const PDF_GOLD = rgb(0.85, 0.55, 0.12);
const PDF_MUTED = rgb(0.35, 0.41, 0.5);
const PDF_BORDER = rgb(0.86, 0.89, 0.93);
const PDF_SURFACE = rgb(0.965, 0.973, 0.985);

function wrapPdfText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) line = next;
      else { if (line) lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    lines.push("");
  }
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

/** The same Tlac + coin-as-o construction used by the product wordmark. */
function drawTlacoWordmark(page: PDFPage, font: PDFFont, x: number, y: number, size = 25) {
  const stem = "Tlac";
  page.drawText(stem, { x, y, size, font, color: PDF_NAVY });
  const stemWidth = font.widthOfTextAtSize(stem, size);
  const radius = size * 0.31;
  const centerX = x + stemWidth + radius + 1;
  const centerY = y + size * 0.38;
  page.drawCircle({ x: centerX, y: centerY, size: radius, color: PDF_GOLD });
  page.drawCircle({ x: centerX, y: centerY, size: radius * 0.39, color: rgb(1, 1, 1) });
  return centerX + radius;
}

function drawPdfMasthead(page: PDFPage, bold: PDFFont, continuation?: string) {
  const logoEnd = drawTlacoWordmark(page, bold, 54, 778);
  page.drawRectangle({ x: logoEnd + 18, y: 789, width: 541 - logoEnd - 18, height: 2.5, color: PDF_BLUE });
  page.drawText(continuation ? "DOCUMENTO LEGAL · CONTINUACIÓN" : "DOCUMENTO LEGAL", { x: 54, y: 744, size: 8, font: bold, color: PDF_BLUE });
  if (continuation) page.drawText(continuation, { x: 54, y: 720, size: 12, font: bold, color: PDF_NAVY });
}

function finishPdfPages(pdf: PDFDocument, regular: PDFFont) {
  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    page.drawRectangle({ x: 54, y: 48, width: 487, height: 1, color: PDF_BORDER });
    page.drawText("Tlaco · Documento privado y versionado", { x: 54, y: 30, size: 7.5, font: regular, color: PDF_MUTED });
    const pageLabel = `Página ${index + 1} de ${pages.length}`;
    page.drawText(pageLabel, { x: 541 - regular.widthOfTextAtSize(pageLabel, 7.5), y: 30, size: 7.5, font: regular, color: PDF_MUTED });
  });
}

/** Private, branded rendering of the immutable legal version. */
export async function createLetterheadDocumentPdf(document: { id: string; title: string; version: string; content: string; effective_at?: string | null }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(document.title);
  pdf.setAuthor("Tlaco");
  pdf.setSubject(`Documento legal ${document.version}`);
  pdf.setCreator("Tlaco");
  pdf.setProducer("Tlaco");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  drawPdfMasthead(page, bold);

  let y = 704;
  for (const line of wrapPdfText(document.title, bold, 23, 487)) {
    if (!line) continue;
    page.drawText(line, { x: 54, y, size: 23, font: bold, color: PDF_NAVY });
    y -= 28;
  }
  page.drawText("Plataforma Tlaco para negocios", { x: 54, y: y - 2, size: 10, font: regular, color: PDF_MUTED });
  y -= 34;

  page.drawRectangle({ x: 54, y: y - 75, width: 487, height: 75, color: PDF_SURFACE, borderColor: PDF_BORDER, borderWidth: 1 });
  page.drawText("VERSIÓN", { x: 72, y: y - 22, size: 7.5, font: bold, color: PDF_MUTED });
  page.drawText(document.version, { x: 72, y: y - 41, size: 10, font: bold, color: PDF_NAVY });
  page.drawText("VIGENCIA", { x: 213, y: y - 22, size: 7.5, font: bold, color: PDF_MUTED });
  page.drawText(document.effective_at ? new Date(document.effective_at).toLocaleDateString("es-MX") : "Pendiente", { x: 213, y: y - 41, size: 10, font: bold, color: PDF_NAVY });
  page.drawText("FOLIO", { x: 354, y: y - 22, size: 7.5, font: bold, color: PDF_MUTED });
  page.drawText(document.id.slice(0, 18), { x: 354, y: y - 41, size: 9, font: regular, color: PDF_NAVY });
  y -= 111;
  page.drawRectangle({ x: 54, y: y + 2, width: 4, height: 18, color: PDF_GOLD });
  page.drawText("CONTENIDO DEL DOCUMENTO", { x: 68, y: y + 6, size: 9, font: bold, color: PDF_NAVY });
  y -= 26;

  const bodyLines = wrapPdfText(document.content, regular, 10.5, 487);
  for (const line of bodyLines) {
    if (y < 78) {
      page = pdf.addPage([595, 842]);
      drawPdfMasthead(page, bold, document.title);
      y = 686;
    }
    if (!line) { y -= 9; continue; }
    page.drawText(line, { x: 54, y, size: 10.5, font: regular, color: PDF_NAVY });
    y -= 17;
  }

  finishPdfPages(pdf, regular);
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
  pdf.setTitle("Comprobante de apertura Tlaco");
  pdf.setAuthor("Tlaco");
  pdf.setCreator("Tlaco");
  pdf.setProducer("Tlaco");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  drawPdfMasthead(page, bold);
  page.drawText("Comprobante de apertura", { x: 54, y: 696, size: 23, font: bold, color: PDF_NAVY });
  page.drawText("Aceptación del acuerdo de uso de Tlaco", { x: 54, y: 671, size: 11, font: regular, color: PDF_MUTED });
  page.drawRectangle({ x: 54, y: 570, width: 487, height: 72, color: PDF_SURFACE, borderColor: PDF_BORDER, borderWidth: 1 });
  page.drawText("FOLIO DE ACEPTACIÓN", { x: 72, y: 619, size: 7.5, font: bold, color: PDF_MUTED });
  page.drawText(input.acceptanceId, { x: 72, y: 599, size: 9, font: regular, color: PDF_NAVY });
  page.drawText(new Date(input.acceptedAt).toLocaleString("es-MX", { timeZone: "America/Mexico_City" }), { x: 376, y: 599, size: 9, font: bold, color: PDF_NAVY });
  let y = 535;
  page.drawRectangle({ x: 54, y: y + 2, width: 4, height: 18, color: PDF_GOLD });
  page.drawText("DATOS DEL NEGOCIO", { x: 68, y: y + 6, size: 9, font: bold, color: PDF_NAVY });
  y -= 25;
  const profileLines = [
    ["Negocio", input.tenantName],
    ["Nombre legal", input.profile.legal_name],
    ["RFC", input.profile.tax_id ?? "Pendiente de completar"],
    ["Teléfono contractual", input.profile.contractual_phone],
    ["Correo contractual", input.profile.contractual_email ?? "Pendiente de completar"],
  ];
  for (const [label, value] of profileLines) {
    page.drawText(label, { x: 54, y, size: 8, font: bold, color: PDF_MUTED });
    page.drawText(value, { x: 184, y, size: 9.5, font: regular, color: PDF_NAVY });
    y -= 21;
  }
  y -= 8;
  page.drawRectangle({ x: 54, y: y + 2, width: 4, height: 18, color: PDF_GOLD });
  page.drawText("DOCUMENTOS ACEPTADOS", { x: 68, y: y + 6, size: 9, font: bold, color: PDF_NAVY });
  y -= 27;
  for (const document of input.documents) {
    page.drawCircle({ x: 59, y: y + 3, size: 3, color: PDF_BLUE });
    page.drawText(`${document.title} · versión ${document.version}`, { x: 70, y, size: 9.5, font: bold, color: PDF_NAVY });
    page.drawText(`Hash ${document.content_hash.slice(0, 20)}`, { x: 70, y: y - 14, size: 7.5, font: regular, color: PDF_MUTED });
    y -= 38;
  }
  page.drawRectangle({ x: 54, y: 79, width: 487, height: 56, color: PDF_SURFACE, borderColor: PDF_BORDER, borderWidth: 1 });
  page.drawText("Registro de evidencia", { x: 70, y: 113, size: 9, font: bold, color: PDF_NAVY });
  page.drawText("Aceptación registrada desde la sesión autenticada del propietario. No constituye certificación externa.", { x: 70, y: 94, size: 8, font: regular, color: PDF_MUTED });
  finishPdfPages(pdf, regular);
  return new Uint8Array(await pdf.save());
}
