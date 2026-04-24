# CLAUDE.md

This file is a pointer for AI agents working on this codebase.

Primary guidance lives in [`AGENTS.md`](AGENTS.md) — read it first. Everything that applies there applies here.

## Quick reference

- **Language:** English only.
- **Stack:** TypeScript ESM, Node ≥ 20, Express, Anthropic SDK, better-sqlite3, zod, pino, vitest.
- **Build:** `npm run build` — outputs to `dist/`.
- **Dev:** `npm run dev` — watch mode with `tsx`.
- **Check:** `npm run typecheck && npm run lint && npm test` before any commit.

## Available skills

Skills live in `.claude/skills/` and are intentionally minimal, generic, and dependency-free.

- [`add-tool`](.claude/skills/add-tool.md) — How to add a new tool to the registry.
- [`debug-webhook`](.claude/skills/debug-webhook.md) — How to investigate webhook events that don't reach the bot.
- [`test-locally`](.claude/skills/test-locally.md) — How to run the bot locally with a public tunnel.

## Hard rules (mirror of AGENTS.md, do not violate)

- No new dependencies without strong justification.
- No UI, dashboards, or visual builders.
- No business-specific verticals in this repo.
- Strict TypeScript, no `any`.
- English only, everywhere.
