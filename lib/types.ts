export type Sentiment = "happy" | "neutral" | "confused" | "angry" | "urgent";

export interface ConversationLog {
  id: number;
  senderId: string;
  pageId: string;
  messageText: string;
  reply: string;
  detectedLanguage: string;
  languageCode: string;
  sentiment: Sentiment;
  intent: string;
  needsHuman: boolean;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  leadLocation: string;
  leadInterest: string;
  leadBudget: string;
  leadCompany: string;
  latencyMs: number;
  createdAt: string;
}

export interface AiResult {
  detected_language: string;
  language_code: string;
  reply: string;
  sentiment: Sentiment;
  intent: string;
  needs_human: boolean;
  lead: {
    name: string;
    phone: string;
    email: string;
    location: string;
    interest: string;
    budget: string;
    company: string;
  };
}
