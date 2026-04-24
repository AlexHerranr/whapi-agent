import { ToolExecutionError } from "../utils/errors.js";
import type { ToolCall, ToolDefinition, ToolResult } from "./types.js";

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();

  register<TInput, TOutput>(tool: ToolDefinition<TInput, TOutput>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" already registered.`);
    }
    this.tools.set(tool.name, tool as ToolDefinition);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  list(): ToolDefinition[] {
    return [...this.tools.values()];
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      return {
        id: call.id,
        name: call.name,
        output: `Tool "${call.name}" is not registered.`,
        isError: true,
      };
    }

    const parsed = tool.schema.safeParse(call.input);
    if (!parsed.success) {
      return {
        id: call.id,
        name: call.name,
        output: `Invalid arguments: ${parsed.error.message}`,
        isError: true,
      };
    }

    try {
      const output = await tool.execute(parsed.data);
      return { id: call.id, name: call.name, output, isError: false };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ToolExecutionError(call.name, message, err);
    }
  }
}
