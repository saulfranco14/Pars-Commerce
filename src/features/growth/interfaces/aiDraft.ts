/** What the AI knows about a lead to write a follow-up that is different from what was already sent. */
export interface AiFollowUpContext {
  businessName: string;
  giro: string;
  place: string;
  senderName: string;
  signature: string;
  greeting: string;
  link: string;
  sentCount: number;
  views: number;
  averageSeconds: number | null;
  sections: string[];
  objection: string | null;
  reply: string | null;
  claimClicked: boolean;
  previousMessages: string[];
}

export interface AiDraft {
  body: string;
}
