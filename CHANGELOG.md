# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] — 2026-04-23

Initial release.

### Added

- WHAPI.cloud webhook receiver (Express).
- Message buffering: groups rapid messages per chat within a configurable window before calling the LLM.
- Claude (Anthropic) provider with tool-calling support.
- Tool registry with two generic examples (`get_weather`, `search_docs`).
- SQLite-backed conversation store (`better-sqlite3`), zero-config.
- Rate limiting per chat (token bucket).
- Structured logging (`pino`).
- Health check endpoint at `/health`.
- Two runnable examples: `01-hello-world`, `02-with-tools`.
- Docker + Docker Compose setup.
