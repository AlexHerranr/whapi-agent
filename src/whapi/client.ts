import { WhapiError } from "../utils/errors.js";
import type { Logger } from "../utils/logger.js";
import type { WhapiSendMessageRequest } from "./types.js";

export interface WhapiClientOptions {
  baseUrl: string;
  token: string;
  logger: Logger;
}

export class WhapiClient {
  constructor(private readonly opts: WhapiClientOptions) {}

  async sendText(
    chatId: string,
    body: string,
    typingMs?: number,
  ): Promise<void> {
    const payload: WhapiSendMessageRequest = { to: chatId, body };
    if (typingMs !== undefined) payload.typing_time = typingMs;

    const res = await fetch(`${this.opts.baseUrl}/messages/text`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.opts.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new WhapiError(
        `sendText failed for chat=${chatId}: ${res.status} ${text}`,
        res.status,
      );
    }
  }

  async sendTyping(chatId: string, durationMs: number): Promise<void> {
    try {
      await fetch(`${this.opts.baseUrl}/presences/${chatId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.opts.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          presence: "typing",
          delay: Math.ceil(durationMs / 1000),
        }),
      });
    } catch (err) {
      this.opts.logger.debug({ err, chatId }, "typing indicator failed");
    }
  }
}
