import { describe, it, expect } from "vitest";

import {
  STAFF_LOGIN_DOMAIN,
  buildStaffUsername,
  isStaffLoginEmail,
  isValidLoginIdentifier,
  loginIdentifierToEmail,
  staffUsernameOf,
} from "@/lib/auth/staffLogin";

describe("loginIdentifierToEmail", () => {
  it("deja un email tal cual, en minúsculas", () => {
    expect(loginIdentifierToEmail("  Ana@Correo.com ")).toBe("ana@correo.com");
  });

  it("convierte un usuario en el email interno", () => {
    expect(loginIdentifierToEmail("Juan.4821")).toBe(`juan.4821@${STAFF_LOGIN_DOMAIN}`);
  });
});

describe("isValidLoginIdentifier", () => {
  it.each(["ana@correo.com", "juan.4821", "mesero-2"])("acepta %s", (value) => {
    expect(isValidLoginIdentifier(value)).toBe(true);
  });

  it.each(["", "ana@", "juan 4821", ".juan", "juan."])("rechaza %j", (value) => {
    expect(isValidLoginIdentifier(value)).toBe(false);
  });
});

describe("staffUsernameOf", () => {
  it("devuelve el usuario de una cuenta sin correo", () => {
    expect(staffUsernameOf(`juan.4821@${STAFF_LOGIN_DOMAIN}`)).toBe("juan.4821");
    expect(isStaffLoginEmail(`juan.4821@${STAFF_LOGIN_DOMAIN}`)).toBe(true);
  });

  it("devuelve null para un correo real", () => {
    expect(staffUsernameOf("ana@correo.com")).toBeNull();
    expect(staffUsernameOf(null)).toBeNull();
  });
});

describe("buildStaffUsername", () => {
  it("usa hasta dos palabras del nombre, sin acentos", () => {
    expect(buildStaffUsername("José Luis Pérez", "4821")).toBe("joseluis.4821");
  });

  it("cae en un prefijo genérico si el nombre no tiene letras", () => {
    expect(buildStaffUsername("  ", "0042")).toBe("equipo.0042");
  });

  it("produce algo que el login acepta", () => {
    expect(isValidLoginIdentifier(buildStaffUsername("María Ñúñez", "1234"))).toBe(true);
  });
});
