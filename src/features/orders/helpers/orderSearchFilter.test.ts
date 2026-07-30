import { describe, it, expect } from "vitest";

import {
  orderSearchFilter,
  sanitizeOrderSearch,
} from "@/features/orders/helpers/orderSearchFilter";

/**
 * El término lo escribe quien atiende y viaja DENTRO de un `or=(...)` de
 * PostgREST, cuya sintaxis usa comas, puntos y paréntesis como separadores. Si
 * pasan tal cual, el término reescribe la consulta.
 */
describe("sanitizeOrderSearch", () => {
  it("deja pasar un número de pedido", () => {
    expect(sanitizeOrderSearch("C12FE2D3")).toBe("C12FE2D3");
  });

  it("deja pasar nombres con acentos y espacios", () => {
    expect(sanitizeOrderSearch("José Ramírez")).toBe("José Ramírez");
  });

  it("quita los separadores de PostgREST", () => {
    expect(sanitizeOrderSearch("a,b)or(c")).toBe("aborc");
  });

  it("quita los comodines para que nadie pida el negocio completo", () => {
    expect(sanitizeOrderSearch("%")).toBe("");
    expect(sanitizeOrderSearch("*")).toBe("");
  });

  it("corta términos absurdamente largos", () => {
    expect(sanitizeOrderSearch("a".repeat(500)).length).toBe(60);
  });
});

describe("orderSearchFilter", () => {
  it("busca el número por subcadena y en mayúsculas", () => {
    const filter = orderSearchFilter("c12f");
    expect(filter).toContain("order_number.ilike.*C12F*");
  });

  it("encuentra el número por el FINAL, no solo por el principio", () => {
    // El caso que no funcionaba: el cliente lee "2D3" de C12FE2D3.
    const filter = orderSearchFilter("E2D3");
    expect(filter).toContain("order_number.ilike.*E2D3*");
  });

  it("con menos de 4 no busca por número: una subcadena corta coincide con todo", () => {
    const filter = orderSearchFilter("ab");
    expect(filter).not.toContain("order_number");
    expect(filter).toContain("customer_name.ilike.*ab*");
  });

  it("con 4 ya incluye el número", () => {
    expect(orderSearchFilter("abcd")).toContain("order_number");
  });

  it("busca nombre, teléfono y correo por coincidencia parcial", () => {
    const filter = orderSearchFilter("5534");
    expect(filter).toContain("customer_name.ilike.*5534*");
    expect(filter).toContain("customer_phone.ilike.*5534*");
    expect(filter).toContain("customer_email.ilike.*5534*");
  });

  it("devuelve null si al sanear no queda nada — el servidor no debe listar todo", () => {
    expect(orderSearchFilter("((()))")).toBeNull();
    expect(orderSearchFilter("   ")).toBeNull();
  });
});
