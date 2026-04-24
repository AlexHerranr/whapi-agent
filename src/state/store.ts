export type ConversationRole = "user" | "assistant";

export interface StoredMessage {
  role: ConversationRole;
  content: string;
  createdAt: number;
}

export interface ConversationStore {
  load(chatId: string, limit?: number): Promise<StoredMessage[]>;
  append(chatId: string, message: StoredMessage): Promise<void>;
  clear(chatId: string): Promise<void>;
  close(): Promise<void>;
}
