import "server-only";
import { z } from "zod";
import { generateText } from "@/lib/ai/gemini";
import { parseStudioCopyIdeas } from "../helpers/aiPrompt";
import { uuidSchema } from "../validations/studioSchemas";
import { requireStudioAccess } from "./studioAccessService";
import { requireStudioData, StudioError } from "./studioErrors";
import type { StudioCopyIdeas } from "../helpers/aiPrompt";
import type { StudioSource } from "../interfaces/studio";

const SYSTEM = `Eres redactor de anuncios para pequeños negocios en México (cualquier giro: comida, autolavado, taller, spa, tienda).
Escribe en español de México, cercano y claro. Sin emojis, sin hashtags, sin comillas.
No inventes precios, descuentos, horarios ni promesas que no estén en los datos.
Responde solo JSON.`;

function describe(source: Partial<StudioSource>) {
  return [
    `Negocio: ${source.businessName ?? "sin nombre"}`,
    `Qué se anuncia: ${source.name ?? ""}`,
    source.priceLabel ? `Precio: ${source.priceLabel}` : "",
    source.badge ? `Oferta: ${source.badge}` : "",
    source.description
      ? `Descripción: ${source.description.slice(0, 300)}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Free text ideas for one ad: big phrases, closing lines and the WhatsApp message. */
export async function suggestStudioCopy(
  raw: unknown,
): Promise<StudioCopyIdeas> {
  const input = z
    .object({ tenant_id: uuidSchema, design_id: uuidSchema })
    .parse(raw);
  const { db, user } = await requireStudioAccess(
    input.tenant_id,
    "studio.create",
    "create",
  );
  if (
    !requireStudioData(
      await db.rpc("studio_rate_limit", {
        p_scope: `copy:${input.tenant_id}:${user.id}`,
        p_limit: 20,
      }),
    )
  )
    throw new StudioError("RATE_LIMIT");
  const design = requireStudioData(
    await db
      .from("studio_designs")
      .select("source_snapshot")
      .eq("tenant_id", input.tenant_id)
      .eq("id", input.design_id)
      .single(),
  );
  const prompt = `${describe(design.source_snapshot as Partial<StudioSource>)}

Devuelve {"phrases":[3 frases grandes para el anuncio, de 2 a 4 palabras, que terminen en punto, que antojen o den ganas],"notes":[3 cierres cortos de máximo 3 palabras que inviten a actuar],"message":"mensaje de WhatsApp de máximo 200 caracteres que presente la oferta; no incluyas enlaces"}`;
  try {
    const ideas = parseStudioCopyIdeas(
      await generateText(SYSTEM, prompt, {
        maxOutputTokens: 500,
        thinkingLevel: "minimal",
      }),
    );
    if (ideas) return ideas;
  } catch (error) {
    console.error(
      "[studio] copy ideas failed",
      error instanceof Error ? error.message : error,
    );
  }
  throw new StudioError(
    "NOT_CONFIGURED",
    "No pudimos sugerir frases ahora. Intenta en un momento.",
  );
}

/** One phrase per product for a batch, in a single call; missing ones fall back to the product name. */
export async function suggestStudioPhrases(
  businessName: string,
  names: string[],
): Promise<string[]> {
  const prompt = `Negocio: ${businessName}
Productos:
${names.map((name, i) => `${i + 1}. ${name}`).join("\n")}

Devuelve {"phrases":[una frase grande por producto, en el mismo orden, de 2 a 4 palabras, que termine en punto]}`;
  try {
    const raw = await generateText(SYSTEM, prompt, {
      maxOutputTokens: 600,
      thinkingLevel: "minimal",
    });
    const data = JSON.parse(
      raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1),
    ) as {
      phrases?: unknown[];
    };
    return names.map((name, i) => {
      const phrase = data.phrases?.[i];
      return typeof phrase === "string" && phrase.trim()
        ? phrase.trim().slice(0, 40)
        : name;
    });
  } catch {
    return names;
  }
}
