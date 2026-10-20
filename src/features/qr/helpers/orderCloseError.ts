/**
 * Closing an order can be refused by the database (stock is discounted when it
 * turns paid). Turn that refusal into something the person at the counter can fix.
 */
export function orderCloseErrorMessage(error: { message?: string; details?: string | null }): string {
  if (error.message === "STOCK_INSUFFICIENT") {
    const product = /product=([^;]+)/.exec(error.details ?? "")?.[1]?.trim();
    return product
      ? `No hay inventario suficiente de ${product} para cerrar la cuenta. Ajusta el inventario y vuelve a confirmar.`
      : "No hay inventario suficiente para cerrar la cuenta. Ajusta el inventario y vuelve a confirmar.";
  }
  return "El pago quedó registrado, pero no se pudo cerrar la cuenta. Vuelve a confirmar en un momento.";
}
