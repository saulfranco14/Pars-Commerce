import { PROSPECTING_PATH as LIST_PATH } from "@/features/growth/constants/routes";

const QUERY_KEY = "tlaco_growth_leads_query";
const FROM_LIST_KEY = "tlaco_growth_leads_from_list";

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* private mode or storage blocked: going back falls back to the plain list */
  }
}

/** Remembers the filtered list so a prospect page can send the operator back to it. */
export function rememberLeadsList(query: string): void {
  write(QUERY_KEY, query);
}

export function markOpenedFromList(): void {
  write(FROM_LIST_KEY, "1");
}

/** History back keeps filters and scroll; a prospect opened from a link goes to the last filtered list. */
export function backToLeads(router: { back: () => void; push: (href: string) => void }): void {
  if (read(FROM_LIST_KEY) && window.history.length > 1) {
    write(FROM_LIST_KEY, null);
    router.back();
    return;
  }
  const query = read(QUERY_KEY);
  router.push(query ? `${LIST_PATH}?${query}` : LIST_PATH);
}
