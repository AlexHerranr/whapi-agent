import type { StoredMessage } from "../state/store.js";
import type { ToolCall, ToolDefinition, ToolResult } from "../tools/types.js";

export interface LLMCompletionInput {
  system: string;
  history: StoredMessage[];
  userGroup: string;
  tools: ToolDefinition[];
  toolResults?: ToolResult[];
}

export interface LLMCompletionOutput {
  text: string;
  toolCalls: ToolCall[];
  stopReason: "end_turn" | "tool_use" | "max_tokens" | string;
}

export interface LLMProvider {
  readonly name: string;
  complete(input: LLMCompletionInput): Promise<LLMCompletionOutput>;
}
