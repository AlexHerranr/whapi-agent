import { z } from "zod";

const configSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  CLAUDE_MODEL: z.string().default("claude-sonnet-4-6"),
  WHAPI_TOKEN: z.string().min(1, "WHAPI_TOKEN is required"),
  WHAPI_API_URL: z.string().url().default("https://gate.whapi.cloud"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
  BUFFER_WINDOW_MS: z.coerce.number().int().positive().default(3000),
  BUFFER_MAX_WINDOW_MS: z.coerce.number().int().positive().default(8000),
  HISTORY_MAX_MESSAGES: z.coerce.number().int().positive().default(30),
  SQLITE_PATH: z.string().default("./data/whapi-agent.sqlite"),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(30),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = configSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid configuration:\n${issues}`);
  }
  return parsed.data;
}
