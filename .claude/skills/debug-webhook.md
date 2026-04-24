---
name: debug-webhook
description: Steps to investigate why incoming messages are not reaching the agent.
---

# Debugging webhooks

Work through these in order. Stop when a check fails — that's the problem.

## 1. Is the server up?

```bash
curl -s http://localhost:3000/health
```

Expect `{"status":"ok",...}`. If not, the process is not running or crashed at boot.

## 2. Is the public URL reachable from the internet?

```bash
curl -s https://<your-public-host>/health
```

If this fails, the tunnel, reverse proxy, or firewall is the issue. Fix this first — WHAPI cannot reach the bot otherwise.

## 3. Is the webhook registered in WHAPI?

In the WHAPI dashboard, confirm the channel's webhook URL ends in `/webhook` and uses the same scheme (https) the tunnel exposes.

## 4. Are events arriving at the server?

Send a message and watch logs:

```bash
docker compose logs -f whapi-agent | grep -i webhook
```

If nothing appears, WHAPI is not sending events. Re-verify steps 2 and 3.

## 5. Are messages being dropped before the buffer?

The webhook handler drops messages that are:

- `from_me === true` (the bot's own outbound messages echoed back)
- non-text types (image, audio, video, etc. — not in v0.1 scope)
- empty after trimming
- over the per-chat rate limit

Raise the log level to `debug` and look for `rate limit exceeded` or check the `type` and `from_me` fields of incoming events.

## 6. Is the buffer holding indefinitely?

If messages reach `MessageBuffer.push` but the LLM is never called, verify the flush timer fires. Log the `flushNow` path and check the configured `BUFFER_WINDOW_MS` isn't absurdly large.

## 7. Is the LLM call failing silently?

Increase log level to `debug`. The flush handler logs any failure in completions or tool execution.

## 8. Reproduce with curl

You can bypass WHAPI entirely to isolate local code:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{
      "id": "test-1",
      "from": "123",
      "chat_id": "123",
      "timestamp": 0,
      "type": "text",
      "text": { "body": "hello" }
    }]
  }'
```

If this works and real WHAPI events don't, the shape of the real events differs from the assumed one — print the raw body and update `src/whapi/types.ts`.
