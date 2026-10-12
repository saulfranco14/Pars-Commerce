/* eslint-disable @typescript-eslint/no-explicit-any -- RPC is introduced by the pending migration. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type QuickInventoryRpc = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{
    data: unknown;
    error: { message?: string } | null;
  }>;
};

type RequestBody = {
  variant_id?: string | null;
  stock_operation?: "receive" | "set";
  stock_quantity?: number | string | null;
  price?: number | string | null;
  note?: string | null;
};

function messageFor(error: string) {
  if (error.includes("PRODUCT_NOT_FOUND")) return "El producto ya no está disponible.";
  if (error.includes("PRODUCT_WRITE_FORBIDDEN")) return "No tienes permiso para actualizar este producto.";
  if (error.includes("VARIANT_REQUIRED")) return "Elige la talla o color que quieres actualizar.";
  if (error.includes("VARIANT_NOT_FOUND")) return "La variante elegida ya no está disponible.";
  if (error.includes("STOCK_NOT_TRACKED")) return "Este producto no controla existencias.";
  if (error.includes("RECEIPT_QUANTITY_REQUIRED")) return "Indica cuántas piezas llegaron.";
  if (error.includes("INVALID_STOCK_QUANTITY")) return "Las existencias deben ser un número entero mayor o igual a cero.";
  if (error.includes("INVALID_PRICE")) return "El precio debe ser mayor o igual a cero.";
  return "No se pudo guardar el ajuste. Inténtalo de nuevo.";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as RequestBody | null;
  if (!body) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  const operation = body.stock_operation ?? "receive";
  if (operation !== "receive" && operation !== "set") {
    return NextResponse.json({ error: "Operación de inventario inválida." }, { status: 400 });
  }

  const quantity = body.stock_quantity == null || body.stock_quantity === ""
    ? null
    : Number(body.stock_quantity);
  const price = body.price == null || body.price === ""
    ? null
    : Number(body.price);

  if (quantity !== null && (!Number.isInteger(quantity) || quantity < 0)) {
    return NextResponse.json({ error: "Las existencias deben ser un número entero mayor o igual a cero." }, { status: 400 });
  }
  if (price !== null && (!Number.isFinite(price) || price < 0)) {
    return NextResponse.json({ error: "El precio debe ser mayor o igual a cero." }, { status: 400 });
  }
  if (quantity === null && price === null) {
    return NextResponse.json({ error: "Indica existencias o un precio para guardar." }, { status: 400 });
  }

  const { data, error } = await (session as unknown as QuickInventoryRpc).rpc(
    "apply_catalog_quick_update",
    {
      p_product_id: id,
      p_variant_id: body.variant_id?.trim() || null,
      p_stock_operation: operation,
      p_stock_quantity: quantity,
      p_price: price,
      p_note: body.note?.trim() || null,
    },
  );

  if (error) {
    return NextResponse.json({ error: messageFor(error.message ?? "") }, { status: 400 });
  }

  return NextResponse.json({ result: data });
}
