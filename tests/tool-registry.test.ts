import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ToolRegistry } from "../src/tools/registry.js";
import { ToolExecutionError } from "../src/utils/errors.js";

describe("ToolRegistry", () => {
  it("executes a registered tool with valid arguments", async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "add",
      description: "adds two numbers",
      schema: z.object({ a: z.number(), b: z.number() }),
      execute: ({ a, b }) => a + b,
    });

    const result = await registry.execute({
      id: "t1",
      name: "add",
      input: { a: 2, b: 3 },
    });

    expect(result.isError).toBe(false);
    expect(result.output).toBe(5);
  });

  it("returns an error result for an unknown tool", async () => {
    const registry = new ToolRegistry();
    const result = await registry.execute({
      id: "t1",
      name: "missing",
      input: {},
    });
    expect(result.isError).toBe(true);
  });

  it("returns an error result for invalid arguments", async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "greet",
      description: "greets",
      schema: z.object({ name: z.string() }),
      execute: ({ name }) => `hi ${name}`,
    });

    const result = await registry.execute({
      id: "t1",
      name: "greet",
      input: { name: 42 },
    });
    expect(result.isError).toBe(true);
  });

  it("throws ToolExecutionError when the tool itself throws", async () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "boom",
      description: "",
      schema: z.object({}),
      execute: () => {
        throw new Error("kaboom");
      },
    });

    await expect(
      registry.execute({ id: "t1", name: "boom", input: {} }),
    ).rejects.toBeInstanceOf(ToolExecutionError);
  });

  it("refuses to register duplicate names", () => {
    const registry = new ToolRegistry();
    registry.register({
      name: "x",
      description: "",
      schema: z.object({}),
      execute: () => 0,
    });
    expect(() =>
      registry.register({
        name: "x",
        description: "",
        schema: z.object({}),
        execute: () => 0,
      }),
    ).toThrow();
  });
});
