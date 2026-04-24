import express from "express";
import type { Server } from "node:http";
import { MessageBuffer, type BufferedGroup } from "./buffer/message-buffer.js";
import { AnthropicProvider } from "./llm/anthropic.js";
import type { LLMProvider } from "./llm/provider.js";
import { SqliteStore } from "./state/sqlite.js";
import type { ConversationStore } from "./state/store.js";
import { ToolRegistry } from "./tools/registry.js";
import type { ToolDefinition } from "./tools/types.js";
import { createLogger, type Logger } from "./utils/logger.js";
import { RateLimiter } from "./utils/rate-limit.js";
import { createWebhookHandler } from "./webhook/handler.js";
import { WhapiClient } from "./whapi/client.js";

export interface AgentOptions {
  anthropicApiKey: string;
  model?: string;
  whapiToken: string;
  whapiApiUrl?: string;
  bufferWindowMs?: number;
  bufferMaxWindowMs?: number;
  historyMaxMessages?: number;
  ratePerMinute?: number;
  sqlitePath?: string;
  logLevel?: string;
  systemPrompt?: string;
  store?: ConversationStore;
  provider?: LLMProvider;
  logger?: Logger;
}

export class Agent {
  private readonly logger: Logger;
  private readonly provider: LLMProvider;
  private readonly store: ConversationStore;
  private readonly buffer: MessageBuffer;
  private readonly whapi: WhapiClient;
  private readonly tools = new ToolRegistry();
  private readonly rateLimiter: RateLimiter;
  private readonly systemPrompt: string;
  private readonly historyMax: number;
  private readonly bufferWindowMs: number;
  private server?: Server;

  constructor(opts: AgentOptions) {
    this.logger = opts.logger ?? createLogger(opts.logLevel ?? "info");
    this.historyMax = opts.historyMaxMessages ?? 30;
    this.bufferWindowMs = opts.bufferWindowMs ?? 3000;
    this.systemPrompt =
      opts.systemPrompt ??
      "You are a helpful assistant replying over WhatsApp. Keep answers short and direct.";
    this.rateLimiter = new RateLimiter(opts.ratePerMinute ?? 30);

    this.provider =
      opts.provider ??
      new AnthropicProvider({
        apiKey: opts.anthropicApiKey,
        model: opts.model ?? "claude-sonnet-4-5",
      });

    this.store =
      opts.store ??
      new SqliteStore({
        path: opts.sqlitePath ?? "./data/whapi-agent.sqlite",
        historyMaxMessages: this.historyMax,
      });

    this.whapi = new WhapiClient({
      baseUrl: opts.whapiApiUrl ?? "https://gate.whapi.cloud",
      token: opts.whapiToken,
      logger: this.logger,
    });

    this.buffer = new MessageBuffer({
      windowMs: this.bufferWindowMs,
      maxWindowMs: opts.bufferMaxWindowMs ?? 8000,
      onFlush: (g) => this.handleFlush(g),
    });
  }

  registerTool<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>): this {
    this.tools.register(tool);
    return this;
  }

  setSystemPrompt(prompt: string): this {
    (this as unknown as { systemPrompt: string }).systemPrompt = prompt;
    return this;
  }

  listen(port: number): Server {
    const app = express();
    app.use(express.json({ limit: "1mb" }));

    app.get("/health", (_req, res) => {
      res.status(200).json({
        status: "ok",
        uptime: Math.round(process.uptime()),
        activeChats: this.buffer.activeChats(),
      });
    });

    app.post(
      "/webhook",
      createWebhookHandler({
        buffer: this.buffer,
        rateLimiter: this.rateLimiter,
        logger: this.logger,
      }),
    );

    this.server = app.listen(port, () => {
      this.logger.info({ port }, "whapi-agent listening");
    });

    return this.server;
  }

  async close(): Promise<void> {
    this.buffer.close();
    await this.store.close();
    if (this.server) {
      await new Promise<void>((resolve) => this.server?.close(() => resolve()));
    }
  }

  private async handleFlush(group: BufferedGroup): Promise<void> {
    const { chatId, texts } = group;
    const userContent = texts.join("\n");
    const now = Date.now();

    try {
      await this.whapi.sendTyping(chatId, this.bufferWindowMs);

      const history = await this.store.load(chatId, this.historyMax);

      let toolResults = undefined;
      let finalText = "";

      for (let step = 0; step < 4; step++) {
        const completion = await this.provider.complete({
          system: this.systemPrompt,
          history,
          userGroup: userContent,
          tools: this.tools.list(),
          toolResults,
        });

        if (completion.toolCalls.length === 0 || completion.stopReason !== "tool_use") {
          finalText = completion.text.trim();
          break;
        }

        toolResults = await Promise.all(
          completion.toolCalls.map((call) => this.tools.execute(call)),
        );
      }

      if (!finalText) {
        finalText = "Sorry, I couldn't produce a reply.";
      }

      await this.store.append(chatId, {
        role: "user",
        content: userContent,
        createdAt: now,
      });
      await this.store.append(chatId, {
        role: "assistant",
        content: finalText,
        createdAt: Date.now(),
      });

      await this.whapi.sendText(chatId, finalText);
    } catch (err) {
      this.logger.error({ err, chatId }, "flush handler failed");
    }
  }
}

export function createAgent(opts: AgentOptions): Agent {
  return new Agent(opts);
}
