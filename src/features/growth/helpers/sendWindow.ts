interface SendWindowSettings {
  timezone: string;
  send_days: number[];
  send_start_hour: number;
  send_end_hour: number;
}

/** Day of week (0 = Sunday) and hour in the engine's timezone. */
export function localClock(now: Date, timezone: string): { weekday: number; hour: number; date: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { weekday, hour: Number(get("hour")), date: `${get("year")}-${get("month")}-${get("day")}` };
}

export function isWithinSendWindow(now: Date, settings: SendWindowSettings): boolean {
  const { weekday, hour } = localClock(now, settings.timezone);
  return settings.send_days.includes(weekday) && hour >= settings.send_start_hour && hour < settings.send_end_hour;
}
