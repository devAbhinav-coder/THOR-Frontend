export type AdminAiTextResult = {
  text: string;
  bullets?: string[];
  intro?: string;
  cached?: boolean;
  generatedAt?: string;
  model?: string;
};

export type AdminAiChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type AdminAiRuleAction = {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  href?: string;
};

export type AdminAiStatus = {
  enabled: boolean;
  model?: string;
  provider?: string;
  blogEnabled?: boolean;
  blogProvider?: "gemini" | "groq";
  blogModel?: string;
  features?: string[];
};
