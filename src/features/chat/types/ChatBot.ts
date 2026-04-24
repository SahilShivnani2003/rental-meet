export interface QuickReply {
  question: string;
  answer: string;
}

export interface ChatbotSettings {
  quickReplies: QuickReply[];
  welcomeMessage: string;
  isEnabled: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}