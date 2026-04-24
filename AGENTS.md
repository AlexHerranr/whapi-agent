# AGENTS.md

Guidance for AI coding agents contributing to `whapi-agent`. Follows the [agents.md](https://agents.md/) convention.

## Project in one paragraph

`whapi-agent` is a TypeScript framework for building WhatsApp AI agents on top of the WHAPI.cloud API. It provides message buffering, a tool registry, LLM provider abstraction (Claude by default), and SQLite-backed conversation state. The project is intentionally minimal — scope creep is rejected.

## Stack

- Node.js ≥ 20, TypeScript strict mode, ESM.
- Express for the webhook server.
- `@anthropic-ai/sdk` for Claude.
- `better-sqlite3` for state.
- `zod` for config validation.
- `pino` for logging.
- `vitest` for tests.

## Directory map

- `src/webhook/` — Express webhook receiver and WHAPI event types.
- `src/buffer/` — Per-chat message buffering with a configurable window.
- `src/llm/` — Provider interface and Claude implementation.
- `src/tools/` — Tool registry plus generic example tools.
- `src/state/` — `ConversationStore` interface and SQLite implementation.
- `src/whapi/` — HTTP client for sending messages.
- `src/utils/` — Logger, config loader, rate limiter, error types.
- `examples/` — Runnable demos. Each is self-contained.
- `docs/` — Architecture and operational documentation.
- `tests/` — Vitest unit tests.

## Conventions

- **Language:** English only, everywhere. Code, comments, commit messages, issues, PRs.
- **No `any`.** Strict TypeScript. Use `unknown` and narrow.
- **One concern per file.** If a file grows past ~150 lines, split it.
- **Comments:** only when the *why* is non-obvious. No comments that restate the code.
- **Errors:** throw typed errors from `src/utils/errors.ts`, never generic `Error`.
- **Config:** read via `src/utils/config.ts` (validated with zod). No `process.env.X` sprinkled in the code.
- **Logging:** use the shared `logger` from `src/utils/logger.ts`. No `console.log`.

## Before committing

```bash
npm run typecheck
npm run lint
npm test
```

All three must pass. CI runs the same.

## When adding a feature

1. Read [`CONTRIBUTING.md`](CONTRIBUTING.md) for scope rules.
2. If it adds a dependency, justify it in the PR description.
3. If it touches `src/buffer/`, `src/tools/`, or `src/state/`, add tests.
4. Update the relevant `docs/` file if behavior changes.

## When adding a tool

See [`.claude/skills/add-tool.md`](.claude/skills/add-tool.md) for the step-by-step recipe.

## When debugging webhooks

See [`.claude/skills/debug-webhook.md`](.claude/skills/debug-webhook.md).

## Hard rules

- Do not add UI, dashboards, or visual builders.
- Do not hardcode provider-specific logic outside `src/llm/<provider>.ts`.
- Do not bypass the buffer — the LLM is always called with a buffered group, never per-message.
- Do not store secrets in code. Everything goes through `.env`.

## Non-goals (deliberately out of scope)

- Multi-tenant orchestration.
- Scheduling, calendars, bookings.
- Payment flows.
- PDF generation.
- Any domain-specific vertical (hospitality, e-commerce, etc.).

Those belong in your own repo that *uses* `whapi-agent` as a dependency.
