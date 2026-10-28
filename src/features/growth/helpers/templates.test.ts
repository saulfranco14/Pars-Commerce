import { describe, expect, it } from "vitest";

import { renderTemplate, templatePlaceholders } from "@/features/growth/helpers/renderTemplate";
import { buildTemplateVars, greetingFor, isGenericBusinessName } from "@/features/growth/helpers/templateVars";
import { validateTemplate } from "@/features/growth/helpers/validateTemplate";

const lead = { business_name: "Ferretería El Clavo", giro: "materiales", municipio: "Chimalhuacán", colonia: "Xochitenco", address: "Calle Hidalgo 12" };

describe("renderTemplate", () => {
  it("fills known placeholders and drops unknown ones", () => {
    expect(renderTemplate("Hola {negocio}, {nada}aquí: {link}", { negocio: "El Clavo", link: "https://x" })).toBe("Hola El Clavo, aquí: https://x");
  });

  it("lists placeholders in order", () => {
    expect(templatePlaceholders("{a} y {b_c} y {a}")).toEqual(["a", "b_c", "a"]);
  });
});

describe("buildTemplateVars", () => {
  it("uses the zone phrase and giro copy", () => {
    const vars = buildTemplateVars(lead, { link: "L", firma: "Saúl", now: new Date("2026-10-28T16:00:00Z") });
    expect(vars.cercania).toBe("vecino de aquí de Chimalhuacán");
    expect(vars.giro_plural).toBe("ferreterías");
    expect(vars.saludo).toBe("Buenos días");
    expect(vars.negocio).toBe("Ferretería El Clavo");
  });

  it("greets by street when the DENUE name is generic", () => {
    const vars = buildTemplateVars({ ...lead, business_name: "Miscelánea", giro: "tienda" }, { link: "L", firma: "S" });
    expect(vars.negocio).toBe("abarrotes de Calle Hidalgo 12");
    expect(isGenericBusinessName("Abarrotes")).toBe(true);
    expect(isGenericBusinessName("Abarrotes Doña Mary")).toBe(false);
  });

  it("falls back for municipios outside the sprint", () => {
    const vars = buildTemplateVars({ ...lead, municipio: "Texcoco", colonia: null }, { link: "L", firma: "S" });
    expect(vars.municipio).toBe("Texcoco");
    expect(vars.colonia).toBe("Texcoco");
  });

  it("greets by Mexico City hour", () => {
    expect([8, 13, 20].map(greetingFor)).toEqual(["Buenos días", "Buenas tardes", "Buenas noches"]);
  });
});

describe("validateTemplate", () => {
  it("accepts a valid WhatsApp first message without link", () => {
    expect(validateTemplate({ channel: "whatsapp", giro: null, step: "m1", variant: "A", subject: null, body: "{saludo}, ¿es {negocio}?" })).toEqual([]);
  });

  it("rejects unknown variables, missing subject and missing link", () => {
    const errors = validateTemplate({ channel: "email", giro: null, step: "d3", variant: "A", subject: "", body: "Hola {nombre}, te escribo otra vez." });
    expect(errors).toContain("El correo necesita un asunto.");
    expect(errors).toContain("Estas variables no existen: {nombre}.");
    expect(errors).toContain("Este paso necesita el link a su tienda: agrega {link}.");
  });

  it("caps WhatsApp length", () => {
    const errors = validateTemplate({ channel: "whatsapp", giro: null, step: "m1", variant: "A", subject: null, body: "x".repeat(1001) });
    expect(errors[0]).toMatch(/1000 caracteres/);
  });
});
