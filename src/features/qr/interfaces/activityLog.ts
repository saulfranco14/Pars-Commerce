export interface OrderActivityLogItem {
  id: string;
  order_id: string;
  actor_type: "device" | "member" | "system" | "webhook";
  actor_id: string | null;
  actor_label: string | null;
  action: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}
