import type { Request, Response } from "express";
import type { MessageBuffer } from "../buffer/message-buffer.js";
import type { Logger } from "../utils/logger.js";
import type { RateLimiter } from "../utils/rate-limit.js";
import type { WhapiWebhookEvent } from "../whapi/types.js";

export interface WebhookHandlerOptions {
  buffer: MessageBuffer;
  rateLimiter: RateLimiter;
  logger: Logger;
}

export function createWebhookHandler(opts: WebhookHandlerOptions) {
  return async function handleWebhook(
    req: Request,
    res: Response,
  ): Promise<void> {
    const body = req.body as WhapiWebhookEvent;

    res.status(200).json({ ok: true });

    const messages = body.messages ?? [];
    for (const msg of messages) {
      if (msg.from_me) continue;
      if (msg.type !== "text") continue;
      const text = msg.text?.body?.trim();
      if (!text) continue;

      if (!opts.rateLimiter.allow(msg.chat_id)) {
        opts.logger.warn(
          { chatId: msg.chat_id },
          "rate limit exceeded, dropping message",
        );
        continue;
      }

      opts.buffer.push(msg.chat_id, text);
    }
  };
}
