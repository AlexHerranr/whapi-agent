import Anthropic from "@anthropic-ai/sdk";
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
      input_schema: zodToJsonSchema(t),
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

function zodToJsonSchema(tool: ToolDefinition): Anthropic.Tool["input_schema"] {
  const def = (tool.schema as unknown as { _def?: { typeName?: string } })._def;
  if (def?.typeName === "ZodObject") {
    const shape = (tool.schema as unknown as { shape: Record<string, unknown> })
      .shape;
    const properties: Record<string, { type: string; description?: string }> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = schemaFieldToJson(value);
      if (!isOptional(value)) required.push(key);
    }
    return { type: "object", properties, required };
  }
  return { type: "object", properties: {} };
}

function schemaFieldToJson(value: unknown): { type: string; description?: string } {
  const node = value as {
    _def?: { typeName?: string; description?: string };
  };
  const typeName = node._def?.typeName;
  const description = node._def?.description;
  const base: { type: string; description?: string } = (() => {
    switch (typeName) {
      case "ZodString":
        return { type: "string" };
      case "ZodNumber":
        return { type: "number" };
      case "ZodBoolean":
        return { type: "boolean" };
      case "ZodArray":
        return { type: "array" };
      case "ZodOptional":
      case "ZodDefault":
        return schemaFieldToJson(
          (node as unknown as { _def: { innerType: unknown } })._def.innerType,
        );
      default:
        return { type: "string" };
    }
  })();
  if (description) base.description = description;
  return base;
}

function isOptional(value: unknown): boolean {
  const typeName = (value as { _def?: { typeName?: string } })._def?.typeName;
  return typeName === "ZodOptional" || typeName === "ZodDefault";
}
