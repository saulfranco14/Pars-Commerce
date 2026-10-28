import type { ParaSender } from "@/features/growth/interfaces/para";

/** "Saúl Franco · Tlaco" → Saúl Franco: the person who signs the outreach messages. */
export function senderFromSignature(signature: string | null | undefined): ParaSender | null {
  const name = (signature ?? "").split(/[·|,]|\s-\s/)[0].trim().replace(/\s+/g, " ");
  if (name.length < 2 || /^tlaco$/i.test(name)) return null;
  return { name, firstName: name.split(" ")[0], initial: name.charAt(0).toUpperCase() };
}

/** Two letters for a product without a photo: "Taco al pastor" → TP, "Cemento 50 kg" → CE. */
export function itemInitials(name: string): string {
  const words = name.split(/\s+/).filter((word) => /^\p{L}{3,}/u.test(word));
  if (words.length >= 2) return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
  return (words[0] ?? name).replace(/[^\p{L}]/gu, "").slice(0, 2).toUpperCase();
}
