import "dotenv/config";
import { createAgent } from "./agent.js";
import { getWeatherTool } from "./tools/examples/get-weather.js";
import { searchDocsTool } from "./tools/examples/search-docs.js";
import { loadConfig } from "./utils/config.js";
import { createLogger } from "./utils/logger.js";

function main(): void {
  const config = loadConfig();
  const logger = createLogger(config.LOG_LEVEL);

  const agent = createAgent({
    anthropicApiKey: config.ANTHROPIC_API_KEY,
    model: config.CLAUDE_MODEL,
    whapiToken: config.WHAPI_TOKEN,
    whapiApiUrl: config.WHAPI_API_URL,
    bufferWindowMs: config.BUFFER_WINDOW_MS,
    bufferMaxWindowMs: config.BUFFER_MAX_WINDOW_MS,
    historyMaxMessages: config.HISTORY_MAX_MESSAGES,
    ratePerMinute: config.RATE_LIMIT_PER_MINUTE,
    sqlitePath: config.SQLITE_PATH,
    logLevel: config.LOG_LEVEL,
    logger,
  });

  agent.registerTool(getWeatherTool);
  agent.registerTool(searchDocsTool);

  agent.listen(config.PORT);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "shutting down");
    await agent.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main();
