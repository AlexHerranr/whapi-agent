import "dotenv/config";
import {
  createAgent,
  createSearchDocsTool,
  getWeatherTool,
  loadConfig,
} from "whapi-agent";

const config = loadConfig();

const faq = createSearchDocsTool([
  {
    title: "Hours",
    body: "We are open every day from 9 am to 9 pm.",
  },
  {
    title: "Booking",
    body: "Reservations can be made online at least 2 hours in advance.",
  },
  {
    title: "Cancellations",
    body: "Free cancellation up to 24 hours before the reservation.",
  },
]);

const agent = createAgent({
  anthropicApiKey: config.ANTHROPIC_API_KEY,
  model: config.CLAUDE_MODEL,
  whapiToken: config.WHAPI_TOKEN,
  whapiApiUrl: config.WHAPI_API_URL,
  bufferWindowMs: config.BUFFER_WINDOW_MS,
  sqlitePath: "./data/with-tools.sqlite",
  systemPrompt: [
    "You are a friendly assistant replying over WhatsApp.",
    "Call get_weather when users ask about weather conditions.",
    "Call search_docs to answer questions about hours, bookings, and cancellations.",
    "Keep replies short.",
  ].join(" "),
});

agent.registerTool(getWeatherTool);
agent.registerTool(faq);

agent.listen(config.PORT);
