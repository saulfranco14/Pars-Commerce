export interface CalendarDate {
  /** YYYY-MM-DD */
  date: string;
  label: string;
  /** Dates that move customers but are not a holiday (quincena) never become «lo que viene». */
  upcoming: boolean;
}

export interface WeekDay {
  date: string;
  total: number;
  /** Same weekday one week earlier, for the comparison. */
  previous: number;
}

export interface LowDay extends WeekDay {
  /** What the calendar had that day: it coincides, it is not the cause. */
  coincides: string[];
}

export interface UpcomingDate {
  label: string;
  start: string;
  end: string;
  /** Days from today until it starts. */
  inDays: number;
}

export interface WeekReport {
  /** The last 14 days, oldest first; the second half is «this week». */
  days: WeekDay[];
  total: number;
  previousTotal: number;
  /** Percent change against the previous 7 days; null without sales to compare. */
  change: number | null;
  lowDays: LowDay[];
  upcoming: UpcomingDate | null;
  giroLabel: string;
  place: string | null;
}

export interface OutsideItem {
  title: string;
  detail: string;
}

export interface OutsideSource {
  title: string;
  url: string;
}

/** What Gemini found outside the business that week, with the pages it read. */
export interface OutsideContext {
  items: OutsideItem[];
  sources: OutsideSource[];
  weekStart: string;
}
