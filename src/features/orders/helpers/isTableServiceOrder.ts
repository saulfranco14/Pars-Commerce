import { requiresReadyBeforePayment } from "@/features/qr/helpers/paymentReadiness";

interface TableEvidence {
  source?: string | null;
  order_type?: string | null;
  qr_code_id?: string | null;
  table_label?: string | null;
}

/**
 * A table order is paid at the end through its account (split groups,
 * customer-declared payments, tips). The generic "listo para cobro → cobro
 * directo" path would mark it paid without settling any of that.
 */
export function isTableServiceOrder(order: TableEvidence): boolean {
  const atATable = Boolean(order.qr_code_id || order.table_label) || order.order_type === "dine_in";
  return atATable && requiresReadyBeforePayment(order.source, order.order_type);
}
