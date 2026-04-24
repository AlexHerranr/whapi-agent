# whapi-agent

A TypeScript runtime for WhatsApp AI agents on top of [WHAPI.cloud](https://whapi.cloud). Holds rapid incoming messages per chat, flushes them as one turn to the LLM, runs tool calls, replies.

[![MIT](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)
[![TypeScript](https://img.shields.io/badge/typescript-strict-blue)](tsconfig.json)
[![Node 20+](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](.nvmrc)

## Install

```bash
git clone https://github.com/AlexHerranr/whapi-agent.git
cd whapi-agent && npm install
```

npm package is planned for `v0.2`.

## Use

```ts
import { createAgent } from "whapi-agent";
import { z } from "zod";

const agent = createAgent({
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  whapiToken: process.env.WHAPI_TOKEN!,
  bufferWindowMs: 3000,
  sqlitePath: "./data/conversations.sqlite",
});

agent.registerTool({
  name: "get_order_status",
  description: "Return the fulfilment status of an order by id.",
  schema: z.object({ orderId: z.string() }),
  execute: async ({ orderId }) => ({ orderId, status: "shipped" }),
});

const server = agent.listen(3000);

process.on("SIGTERM", () => {
  server.close();
  agent.close();
});
```

Point your WHAPI channel webhook at `http://<host>:3000/webhook`.

## Docker

```bash
cp .env.example .env   # set ANTHROPIC_API_KEY and WHAPI_TOKEN
docker compose up
```

The compose file mounts `./data` into the container so the SQLite store survives restarts.

## What it does

- Receives WHAPI webhook events.
- Buffers incoming messages per `chat_id` within a configurable window (`BUFFER_WINDOW_MS`, default 3000, hard cap 8000) so that `"hola"`, `"una pregunta"`, `"sobre mi pedido"` sent in two seconds land as one LLM turn instead of four.
- Calls Anthropic. Routes `tool_use` blocks through a typed tool registry with Zod schemas.
- Stores history in SQLite via `better-sqlite3`.
- Token-bucket rate limit per chat. `/health` endpoint. Structured logs with `pino`.

See [`docs/message-buffering.md`](docs/message-buffering.md) for the buffering semantics and [`docs/architecture.md`](docs/architecture.md) for the request lifecycle.

## Why not the alternatives

Most projects in this space sit at one of two layers:

- **Low-level WhatsApp clients** — [Baileys](https://github.com/WhiskeySockets/Baileys), [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), [WAHA](https://github.com/devlikeapro/waha), [Evolution API](https://github.com/EvolutionAPI/evolution-api). You get messages in and out; the LLM loop is on you.
- **Full builders** — [BuilderBot](https://github.com/codigoencasa/builderbot), [Typebot](https://github.com/baptisteArno/typebot.io), [Botpress](https://github.com/botpress/botpress), [Chatwoot](https://github.com/chatwoot/chatwoot). Opinionated, UI-first, or omnichannel. Lose control of the LLM loop in exchange for a platform.

`whapi-agent` is the middle layer: a thin runtime on top of WHAPI.cloud that owns the LLM loop (buffering, tool calls, state) and nothing else. Pick it if you are on WHAPI, writing TypeScript, and want that loop as a library rather than a platform.

## Examples

- [`examples/01-hello-world`](examples/01-hello-world) — minimal agent, no tools.
- [`examples/02-with-tools`](examples/02-with-tools) — `get_weather` (Open-Meteo) and `search_docs`.

## Deployment

Any Node 20 host. Recipes for Docker, Railway, Fly.io, and systemd in [`docs/deployment.md`](docs/deployment.md).

## Contributing

Read [`AGENTS.md`](AGENTS.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md). Scope is deliberately narrow.

## License

[MIT](LICENSE). Maintained by [Alexander H.](https://github.com/AlexHerranr) at Herran Dynamics S.A.S.
