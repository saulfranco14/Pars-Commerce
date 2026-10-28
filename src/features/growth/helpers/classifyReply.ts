import { AUTO_REPLY_SUBJECT, BOUNCE_SENDER, BOUNCE_SUBJECT, REJECTION_PATTERNS } from "@/features/growth/constants/replyKeywords";

export type ReplyKind = "bounce" | "auto_reply" | "rejection" | "reply";

interface IncomingMail {
  from: string;
  subject: string;
  text: string;
  headers: Record<string, string>;
}

/** Strips the quoted original so "no me interesa" in our own text never counts as theirs. */
export function stripQuoted(text: string): string {
  const lines = text.split(/\r?\n/);
  const cut = lines.findIndex((line) => /^>/.test(line) || /^(el|on)\s.+(escribi[oó]|wrote):?$/i.test(line.trim()));
  return (cut === -1 ? lines : lines.slice(0, cut)).join("\n").trim();
}

export function classifyReply(mail: IncomingMail): ReplyKind {
  const contentType = mail.headers["content-type"] ?? "";
  if (BOUNCE_SENDER.test(mail.from) || /report-type=delivery-status/i.test(contentType) || BOUNCE_SUBJECT.test(mail.subject)) {
    return "bounce";
  }
  const autoSubmitted = mail.headers["auto-submitted"] ?? "";
  if ((autoSubmitted && autoSubmitted.toLowerCase() !== "no") || mail.headers["x-autoreply"] || mail.headers["x-autorespond"] || AUTO_REPLY_SUBJECT.test(mail.subject)) {
    return "auto_reply";
  }
  const own = stripQuoted(mail.text);
  if (REJECTION_PATTERNS.some((pattern) => pattern.test(own))) return "rejection";
  return "reply";
}
