import { describe, expect, it } from "vitest";

import { buildMapsLink, buildMapsSearchLink, buildWaLink } from "@/features/growth/helpers/buildWaLink";
import { classifyReply, stripQuoted } from "@/features/growth/helpers/classifyReply";
import { emailFooter, replySubject } from "@/features/growth/helpers/emailFooter";
import { normalizeLead, parseCsvLine } from "@/features/growth/helpers/normalizeLead";
import { decodeCallback, encodeCallback, parseTelegramUpdate } from "@/features/growth/helpers/parseTelegramUpdate";
import { safeEqual } from "@/features/growth/helpers/safeEqual";
import { isWithinSendWindow, localClock } from "@/features/growth/helpers/sendWindow";
import { warmupCap } from "@/features/growth/helpers/warmupCap";

const settings = { timezone: "America/Mexico_City", send_days: [1, 2, 3, 4, 5, 6], send_start_hour: 9, send_end_hour: 18 };

describe("sendWindow", () => {
  it("reads the clock in Mexico City", () => {
    expect(localClock(new Date("2026-10-28T15:30:00Z"), "America/Mexico_City")).toEqual({ weekday: 3, hour: 9, date: "2026-10-28" });
  });

  it("sends only on working hours and days", () => {
    expect(isWithinSendWindow(new Date("2026-10-28T16:00:00Z"), settings)).toBe(true);
    expect(isWithinSendWindow(new Date("2026-10-28T14:00:00Z"), settings)).toBe(false);
    expect(isWithinSendWindow(new Date("2026-11-01T18:00:00Z"), settings)).toBe(false);
  });
});

describe("warmupCap", () => {
  it("ramps 10 → 30 by weeks", () => {
    const today = new Date("2026-11-20T12:00:00Z");
    expect(warmupCap(null, 30, today)).toBe(10);
    expect(warmupCap("2026-11-18", 30, today)).toBe(10);
    expect(warmupCap("2026-11-10", 30, today)).toBe(15);
    expect(warmupCap("2026-09-01", 30, today)).toBe(30);
    expect(warmupCap("2026-09-01", 20, today)).toBe(20);
  });
});

describe("links", () => {
  it("builds wa.me and Maps links", () => {
    expect(buildWaLink("+525511944269", "Hola, ¿es?")).toBe("https://wa.me/525511944269?text=Hola%2C%20%C2%BFes%3F");
    expect(buildMapsLink(19.42, -98.95)).toBe("https://www.google.com/maps/search/?api=1&query=19.42,-98.95");
    expect(buildMapsSearchLink({ business_name: "100% Frijolero", address: "Calle A Canutillo", colonia: null, municipio: "Ixtapaluca" }))
      .toBe("https://www.google.com/maps/search/?api=1&query=100%25%20Frijolero%2C%20Calle%20A%20Canutillo%2C%20Ixtapaluca%2C%20Estado%20de%20M%C3%A9xico");
  });
});

describe("classifyReply", () => {
  const base = { from: "dueno@gmail.com", subject: "Re: tu tienda", text: "", headers: {} };

  it("detects bounces and auto replies by headers", () => {
    expect(classifyReply({ ...base, from: "Mail Delivery Subsystem <mailer-daemon@googlemail.com>" })).toBe("bounce");
    expect(classifyReply({ ...base, headers: { "auto-submitted": "auto-replied" } })).toBe("auto_reply");
    expect(classifyReply({ ...base, subject: "Fuera de la oficina" })).toBe("auto_reply");
  });

  it("treats any rejection as do-not-contact, including rude ones", () => {
    expect(classifyReply({ ...base, text: "No gracias" })).toBe("rejection");
    expect(classifyReply({ ...base, text: "ya no me escriban" })).toBe("rejection");
    expect(classifyReply({ ...base, text: "dejen de estar chingando" })).toBe("rejection");
  });

  it("does not read rejections inside our quoted email or in questions", () => {
    expect(classifyReply({ ...base, text: "¿Cuánto cuesta?\n\nEl mar, 28 oct, Saúl escribió:\n> Si no te interesa, no pasa nada" })).toBe("reply");
    expect(classifyReply({ ...base, text: "¿No me mandas el link?" })).toBe("reply");
    expect(stripQuoted("hola\n> citado")).toBe("hola");
  });
});

describe("normalizeLead", () => {
  it("maps a DENUE row and normalizes contacts", () => {
    const lead = normalizeLead({
      denue_id: "123", negocio: "Ferretería El Clavo", giro: "materiales", municipio: "Chimalhuacán",
      telefono: "+525512345678", correo: "Dueno@Gmail.com", lat: "19.42", lng: "-98.95", colonia: "Xochitenco",
    });
    expect(lead).toMatchObject({ denue_id: "123", catalog_template_key: "materiales", phone_e164: "+525512345678", email: "dueno@gmail.com", lat: 19.42 });
  });

  it("skips rows without a known giro or id", () => {
    expect(normalizeLead({ denue_id: "1", negocio: "X", giro: "taller", municipio: "Neza" })).toBeNull();
    expect(normalizeLead({ negocio: "X", giro: "tienda", municipio: "Neza" })).toBeNull();
  });

  it("parses quoted CSV fields", () => {
    expect(parseCsvLine('1,"Abarrotes ""La Güera""",tienda,"Calle 1, Col. Centro"')).toEqual(["1", 'Abarrotes "La Güera"', "tienda", "Calle 1, Col. Centro"]);
  });
});

describe("telegram", () => {
  it("parses commands, callbacks and locations", () => {
    expect(parseTelegramUpdate({ update_id: 1, message: { message_id: 1, chat: { id: 9 }, text: "/start ABC123" } })).toEqual({ kind: "command", chatId: 9, command: "start", args: "ABC123" });
    expect(parseTelegramUpdate({ update_id: 2, message: { message_id: 2, chat: { id: 9 }, text: "/lote@TlacoVentasBot" } })).toEqual({ kind: "command", chatId: 9, command: "lote", args: "" });
    expect(parseTelegramUpdate({ update_id: 3, message: { message_id: 3, chat: { id: 9 }, location: { latitude: 19.4, longitude: -98.9 } } })).toEqual({ kind: "location", chatId: 9, lat: 19.4, lng: -98.9 });
    expect(parseTelegramUpdate({ update_id: 4, callback_query: { id: "q", data: "o:s:abc", message: { message_id: 5, chat: { id: 9 } } } })).toEqual({ kind: "callback", chatId: 9, callbackId: "q", data: "o:s:abc", messageId: 5 });
    expect(parseTelegramUpdate({ update_id: 5 })).toEqual({ kind: "ignored" });
  });

  it("keeps callback data within 64 bytes", () => {
    const id = "6f1c2a7e-3b9d-4c55-9a51-0f2a6f0e7c11";
    expect(decodeCallback(encodeCallback("o", "nc", id))).toEqual({ action: "o", args: ["nc", id] });
    expect(() => encodeCallback("x".repeat(65))).toThrow();
  });
});

describe("safeEqual", () => {
  it("compares secrets", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual(null, "abc")).toBe(false);
    expect(safeEqual("abc", undefined)).toBe(false);
  });
});

describe("email thread", () => {
  it("answers in the same thread with the first subject", () => {
    expect(replySubject("Una tienda en línea para Ferretería El Tornillo")).toBe("Re: Una tienda en línea para Ferretería El Tornillo");
    expect(replySubject("RE: Pregunta para Abarrotes Lupita")).toBe("RE: Pregunta para Abarrotes Lupita");
  });

  it("keeps the opt-out link and privacy notice in usted", () => {
    const footer = emailFooter({ unsubscribeUrl: "https://tlaco.app/baja/x", postalAddress: null, privacyUrl: "https://tlaco.app/privacidad" });
    expect(footer).toContain("Si ya no desea recibir estos correos: https://tlaco.app/baja/x");
    expect(footer).toContain("Tlaco · Aviso de privacidad: https://tlaco.app/privacidad");
  });
});
