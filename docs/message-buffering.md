# Message buffering

## The problem

In text chat, humans rarely send a single self-contained message. A conversation starter often looks like this:

```
t+0.0s  "hola"
t+0.8s  "tengo una pregunta"
t+1.6s  "sobre mi pedido"
t+2.4s  "el 1234"
```

Four webhook events in under three seconds. A naive webhook-to-LLM loop will:

- fire four separate LLM calls,
- each with incomplete context,
- each producing a reply,
- with no guarantee the replies are delivered in order.

The user ends up reading four replies, two of them apologising for not having context the user had already provided.

## The approach

Hold inbound messages per `chat_id` in memory. On the first message, schedule a flush for `t + windowMs`. Any subsequent message from the same chat extends the window up to a cap. When the window expires, concatenate the buffered messages in order and hand the group to the LLM as a single turn.

```ts
onMessage(chat, text) {
  const buf = buffers.get(chat) ?? { texts: [], timer: null, firstAt: Date.now() };
  buf.texts.push(text);

  if (Date.now() - buf.firstAt >= maxWindowMs) {
    clearTimeout(buf.timer);
    flush(chat, buf);
    return;
  }

  clearTimeout(buf.timer);
  buf.timer = setTimeout(() => flush(chat, buf), windowMs);
  buffers.set(chat, buf);
}
```

The real implementation in `src/buffer/message-buffer.ts` adds:

- a hard ceiling (`maxWindowMs`) so a user typing forever doesn't starve replies,
- cancellation when the store is closed,
- isolation per `chat_id` so no buffer affects any other conversation,
- deterministic ordering by server receive time.

## Tradeoffs

**Window too short (<1s).** Fragments still slip through. A user who hits Enter between words on mobile keyboards (common) still triggers multiple flushes.

**Window too long (>6s).** The agent feels slow. Users start a second message thread before the first reply lands.

**Sweet spot in our data: 2–4s.** The default is `3000ms`. Tune with `BUFFER_WINDOW_MS`.

**Typing indicator.** The bot emits a WHAPI typing indicator while the buffer is open. This masks latency and signals "I'm listening, keep going."

**Partial processing.** Not supported. If the user says something urgent in the first message and changes their mind in the fourth, the agent sees the whole group. This is almost always the right behaviour. A `force_flush_tokens` list (e.g. `["urgent", "cancel"]`) is on the `v0.2` roadmap.

**Sticky context.** The buffer does not replace conversation history. Previously buffered-and-flushed groups live in the SQLite store and are included in the next LLM call as prior turns.

## Why not debounce forever?

Pure debounce (`reset timer on every new message`) means a chatty user can keep the buffer open indefinitely, and an LLM reply never arrives. The hard `maxWindowMs` ceiling prevents starvation at the cost of occasional splits when the user types past the ceiling. That split is recoverable — the next group starts with the partial tail and the LLM has the previous group in history.

## Why not per-word WebSocket stream?

WHAPI exposes discrete message events, not a typing stream. Even if it did, routing partial tokens to an LLM and continuously cancelling in-flight completions is expensive and brittle. Buffering at the message boundary is the correct layer.

## Failure modes

- **Server restart mid-window:** buffered messages are lost. Acceptable: the user will see their last message sit unanswered and resend, or the next message will start a new buffer that includes prior turns from SQLite. A durable buffer is possible but out of scope for v0.1.
- **Clock skew:** timestamps come from the server's monotonic clock, not the client's. WHAPI timestamps are only used for ordering within a single flush.
- **Memory growth:** bounded by active chats × bytes per buffered group. A pathological flood is mitigated by the rate limiter in `src/utils/rate-limit.ts`.
