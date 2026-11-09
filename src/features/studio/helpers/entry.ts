export function studioEntryHref(plan?: string, action = "create"): string {
  const q = new URLSearchParams({
    studio_action: action === "home" ? "home" : "create",
  });
  if (plan && ["basic", "pro", "business"].includes(plan))
    q.set("studio_plan", plan);
  return `/studio/entrar?${q}`;
}
export function studioLoginRegistrationHref(next: string): string {
  const target = new URL(next, "https://tlaco.app");
  if (target.pathname !== "/studio/entrar") return "/registro";
  const q = new URLSearchParams({
    producto: "studio",
    studio_action:
      target.searchParams.get("studio_action") === "home" ? "home" : "create",
    studio_origin: "studio",
  });
  const plan = target.searchParams.get("studio_plan");
  if (plan && ["basic", "pro", "business"].includes(plan))
    q.set("studio_plan", plan);
  return `/registro?${q}`;
}
export function isStudioBusinessEntry(settings: unknown): boolean {
  return (
    (settings as { registration_intent?: { entry_product?: string } } | null)
      ?.registration_intent?.entry_product === "studio"
  );
}

export function studioBusinessEntryHref(
  slug: string,
  settings: unknown,
): string {
  const intent = (
    settings as {
      registration_intent?: { studio_plan?: unknown; studio_action?: unknown };
    } | null
  )?.registration_intent;
  const query = new URLSearchParams({
    studio_action: intent?.studio_action === "home" ? "home" : "create",
  });
  if (
    typeof intent?.studio_plan === "string" &&
    ["basic", "pro", "business"].includes(intent.studio_plan)
  )
    query.set("studio_plan", intent.studio_plan);
  return `/dashboard/${encodeURIComponent(slug)}/studio?${query}`;
}
