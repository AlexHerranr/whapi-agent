# Contributing

Thanks for considering a contribution to `whapi-agent`. This project values small, focused changes over large rewrites.

## Before you start

- Open an issue to discuss non-trivial changes before writing code.
- For typos, docs, or small fixes: open the PR directly.
- Check the roadmap in `README.md` so we don't duplicate work.

## Development setup

```bash
git clone https://github.com/AlexHerranr/whapi-agent.git
cd whapi-agent
npm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY and WHAPI_TOKEN
npm run dev
```

## Checks before opening a PR

```bash
npm run typecheck
npm run lint
npm test
```

CI runs the same three.

## Commit style

Use short, imperative messages in English:

```
feat: add OpenAI provider adapter
fix: handle empty buffer flush
docs: clarify webhook signature verification
```

No emoji in commit messages. No Spanish.

## Scope rules

`whapi-agent` is deliberately minimal. Pull requests that expand scope (new integrations, non-essential features) will likely be closed. When in doubt, open an issue first.

Things we welcome:

- Bug fixes
- Performance improvements
- Additional LLM provider adapters
- Additional state store adapters
- Documentation improvements
- Examples that show real patterns

Things we usually decline:

- UI / dashboards
- Business-specific plugins
- Opinionated prompt templates

## Code style

- TypeScript strict mode. No `any`.
- One concern per file. Small functions.
- No comments that restate the code — only comments that explain non-obvious constraints or tradeoffs.
- Tests for anything in `src/buffer/`, `src/tools/`, and `src/state/`.

## License

By contributing, you agree that your contributions are licensed under the MIT License, same as the project.
