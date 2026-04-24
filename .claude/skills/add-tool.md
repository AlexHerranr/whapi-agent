---
name: add-tool
description: Recipe for adding a new tool to the ToolRegistry so the LLM can call it during a conversation.
---

# Adding a tool

## 1. Define the tool

Create a file under `src/tools/examples/` (or in your own codebase that consumes `whapi-agent`):

```ts
import { z } from "zod";
import type { ToolDefinition } from "whapi-agent";

const schema = z.object({
  orderId: z.string().describe("Unique order identifier."),
});

export const getOrderStatusTool: ToolDefinition<z.infer<typeof schema>> = {
  name: "get_order_status",
  description: "Return the fulfilment status of an order by id.",
  schema,
  execute: async ({ orderId }) => {
    // talk to your database or service here
    return { orderId, status: "shipped" };
  },
};
```

## 2. Register the tool

In the file where you construct the agent:

```ts
agent.registerTool(getOrderStatusTool);
```

## 3. Teach the system prompt

LLMs don't call tools they don't know they have. Add a line to the system prompt:

```
Call get_order_status when the user asks about an order by id.
```

## 4. Constraints

- `name` must be unique across all registered tools.
- `name` must be snake_case and short. The LLM uses it verbatim.
- `schema` should have `.describe()` on each field when the purpose is not obvious — the LLM reads those descriptions.
- `execute` may be sync or async. Throwing from `execute` raises a `ToolExecutionError` and the flush handler will log and recover.

## 5. Test it

Add a test under `tests/` that feeds the tool to `ToolRegistry.execute` with valid and invalid inputs. Examples live in `tests/tool-registry.test.ts`.
