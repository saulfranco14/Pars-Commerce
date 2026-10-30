import { describe, expect, it } from "vitest";

import { denueToLead, parseLeadCsv } from "@/features/growth/helpers/importRows";

describe("denueToLead", () => {
  it("maps an API record like a row of the DENUE file, whatever the key case", () => {
    const lead = denueToLead(
      {
        Id: "10687683", Nombre: "Aulavado El Rayo", Razon_social: "", Clase_actividad: "Lavado y lubricado", Estrato: "6 a 10 personas",
        Tipo_vialidad: "CALLE", Calle: "Camino Viejo", Num_Exterior: "12", colonia: "Lomas de Buenavista", CP: "56338",
        Telefono: "5576913207", Correo_e: "RAYO@EXAMPLE.COM", Latitud: "19.383", Longitud: "-98.928",
      },
      { giro: "autolavado", clase: "811192", municipio: "Chimalhuacán" },
    );
    expect(lead).toMatchObject({
      denue_id: "10687683", business_name: "Aulavado El Rayo", giro: "autolavado", municipio: "Chimalhuacán",
      colonia: "Lomas de Buenavista", address: "CALLE Camino Viejo 12", phone_e164: "+525576913207", email: "rayo@example.com",
      lat: 19.383, lng: -98.928, source_detail: "811192",
    });
  });

  it("skips a record without id or name", () => {
    expect(denueToLead({ Nombre: "" }, { giro: "tienda", clase: "461110", municipio: "Neza" })).toBeNull();
  });
});

describe("parseLeadCsv", () => {
  it("reads Spanish headers in any order and giro by label", () => {
    const { rows, problems } = parseLeadCsv("Teléfono,Negocio,Giro,Municipio,Nota\n55 1234 5678,Tacos El Güero,Taquería,Nezahualcóyotl,Visitar martes\n,Sin giro,Zapatos raros,Neza,");
    expect(rows).toEqual([
      { row: 2, input: { business_name: "Tacos El Güero", phone: "55 1234 5678", email: "", giro: "taqueria", municipio: "Nezahualcóyotl", colonia: "", source_detail: "otro", note: "Visitar martes" } },
    ]);
    expect(problems).toEqual([{ row: 3, reason: "Giro desconocido: «Zapatos raros»." }]);
  });

  it("explains a file without the needed columns", () => {
    expect(parseLeadCsv("nombre,giro\nX,tienda").problems[0].reason).toBe("Falta la columna «telefono» o «correo».");
  });
});
