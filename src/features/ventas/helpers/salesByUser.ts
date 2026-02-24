import type { OrderListItem } from "@/types/orders";

export function salesByUser(orders: OrderListItem[]) {
  const paidOrCompleted = orders.filter((o) =>
    ["paid", "completed"].includes(o.status),
  );
  const byUserId: Record<
    string,
    { total: number; name: string; count: number }
  > = {};
  for (const o of paidOrCompleted) {
    const uid = o.assigned_to ?? "__sin_asignar__";
    const name = o.assigned_user
      ? o.assigned_user.display_name ||
        o.assigned_user.email?.split("@")[0] ||
        "Usuario"
      : "Sin asignar";
    if (!byUserId[uid]) {
      byUserId[uid] = { total: 0, name, count: 0 };
    }
    byUserId[uid].total += Number(o.total);
    byUserId[uid].count += 1;
  }
  return Object.entries(byUserId)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);
}
