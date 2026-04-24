export interface WhapiIncomingMessage {
  id: string;
  from: string;
  chat_id: string;
  timestamp: number;
  type: "text" | "image" | "audio" | "video" | "document" | string;
  text?: { body: string };
  from_me?: boolean;
}

export interface WhapiWebhookEvent {
  messages?: WhapiIncomingMessage[];
  event?: { type: string };
}

export interface WhapiSendMessageRequest {
  to: string;
  body: string;
  typing_time?: number;
}
