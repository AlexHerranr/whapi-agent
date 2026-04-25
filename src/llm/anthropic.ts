import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ProviderError } from "../utils/errors.js";
import type { ToolDefinition, ToolResult } from "../tools/types.js";
import type {
  LLMCompletionInput,
  LLMCompletionOutput,
  LLMProvider,
} from "./provider.js";

export interface AnthropicProviderOptions {
  apiKey: string;
  model: string;
  maxTokens?: number;
}

export class AnthropicProvider implements LLMProvider {
  readonly name = "anthropic";
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(opts: AnthropicProviderOptions) {
    this.client = new Anthropic({ apiKey: opts.apiKey });
    this.model = opts.model;
    this.maxTokens = opts.maxTokens ?? 1024;
  }

  async complete(input: LLMCompletionInput): Promise<LLMCompletionOutput> {
    try {
      const messages = this.buildMessages(input);
      const res = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: input.system,
        messages,
        tools: input.tools.length > 0 ? this.mapTools(input.tools) : undefined,
      });

      let text = "";
      const toolCalls: LLMCompletionOutput["toolCalls"] = [];

      for (const block of res.content) {
        if (block.type === "text") text += block.text;
        if (block.type === "tool_use") {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
      }

      return { text, toolCalls, stopReason: res.stop_reason ?? "end_turn" };
    } catch (err) {
      throw new ProviderError("Anthropic completion failed", err);
    }
  }

  private buildMessages(
    input: LLMCompletionInput,
  ): Anthropic.MessageParam[] {
    const messages: Anthropic.MessageParam[] = input.history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    messages.push({ role: "user", content: input.userGroup });

    if (input.toolResults && input.toolResults.length > 0) {
      messages.push({
        role: "assistant",
        content: input.toolResults.map((r) => ({
          type: "tool_use" as const,
          id: r.id,
          name: r.name,
          input: {},
        })),
      });
      messages.push({
        role: "user",
        content: input.toolResults.map((r) => this.mapToolResult(r)),
      });
    }
    return messages;
  }

  private mapTools(tools: ToolDefinition[]): Anthropic.Tool[] {
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: zodToInputSchema(t.schema),
    }));
  }

  private mapToolResult(r: ToolResult): Anthropic.ToolResultBlockParam {
    return {
      type: "tool_result",
      tool_use_id: r.id,
      content: typeof r.output === "string" ? r.output : JSON.stringify(r.output),
      is_error: r.isError,
    };
  }
}

function zodToInputSchema(
  schema: z.ZodType<unknown>,
): Anthropic.Tool["input_schema"] {
  const json = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  if (json["type"] !== "object") {
    return { type: "object", properties: {} };
  }
  return {
    type: "object",
    properties: (json["properties"] as Record<string, unknown>) ?? {},
    required: (json["required"] as string[] | undefined) ?? undefined,
  };
}
