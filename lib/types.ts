export type Sentiment = "happy" | "neutral" | "confused" | "angry" | "urgent";

export interface LeadInfo {
  name: string;
  phone: string;
  email: string;
  location: string;
  interest: string;
  budget: string;
  company: string;
}

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
  isResolved?: boolean;
  agentReply?: string;
  agentRepliedAt?: string;
  source?: "webhook" | "simulator" | "seed";
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
  escalation_reason?: string;
  lead: LeadInfo;
  confidence?: number;
}

export interface BusinessFaq {
  question: string;
  answer: string;
  keywords: string[];
}

export interface BusinessProduct {
  name: string;
  price: string;
  category: string;
  description: string;
}

export interface BusinessProfile {
  businessName: string;
  tagline: string;
  industry: string;
  currency: string;
  operatingHours: string;
  deliveryCoverage: string;
  deliveryTime: string;
  deliveryFee: string;
  returnPolicy: string;
  paymentMethods: string[];
  supportPhone: string;
  supportEmail: string;
  products: BusinessProduct[];
  faqs: BusinessFaq[];
}

export interface AnalyticsSummary {
  totalConversations: number;
  totalHandoffs: number;
  resolvedHandoffs: number;
  pendingHandoffs: number;
  resolutionRatePct: number;
  totalLeads: number;
  avgLatencyMs: number;
  sentimentBreakdown: Record<Sentiment, number>;
  languageBreakdown: Record<string, number>;
  intentBreakdown: Record<string, number>;
}
