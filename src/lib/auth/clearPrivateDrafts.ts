export function clearPrivateDrafts(activeUserId?: string): void {
  try {
    const prefix = "tlaco:studio:v1:";
    for (const key of Object.keys(localStorage)) {
      if (
        key.startsWith(prefix) &&
        (!activeUserId || !key.startsWith(`${prefix}${activeUserId}:`))
      )
        localStorage.removeItem(key);
    }
  } catch {
    /* Session cleanup must also work when browser storage is unavailable. */
  }
}
