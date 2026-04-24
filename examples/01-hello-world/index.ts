import "dotenv/config";
import { createAgent, loadConfig } from "whapi-agent";

const config = loadConfig();

const agent = createAgent({
  anthropicApiKey: config.ANTHROPIC_API_KEY,
  model: config.CLAUDE_MODEL,
  whapiToken: config.WHAPI_TOKEN,
  whapiApiUrl: config.WHAPI_API_URL,
  bufferWindowMs: config.BUFFER_WINDOW_MS,
  sqlitePath: "./data/hello-world.sqlite",
  systemPrompt:
    "You are a concise WhatsApp assistant. Reply in the same language the user wrote.",
});

agent.listen(config.PORT);
