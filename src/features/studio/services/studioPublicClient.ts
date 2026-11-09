export async function publicArtworkEligible(url: string): Promise<boolean> {
  try {
    return (
      await fetch(url, {
        method: "HEAD",
        cache: "no-store",
        credentials: "omit",
      })
    ).ok;
  } catch {
    return false;
  }
}
