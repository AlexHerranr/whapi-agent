import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MessageBuffer, type BufferedGroup } from "../src/buffer/message-buffer.js";

describe("MessageBuffer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("groups messages within the window into a single flush", async () => {
    const flushes: BufferedGroup[] = [];
    const buf = new MessageBuffer({
      windowMs: 100,
      maxWindowMs: 500,
      onFlush: (g) => {
        flushes.push(g);
      },
    });

    buf.push("chat-1", "hello");
    buf.push("chat-1", "how are you");
    buf.push("chat-1", "?");

    await vi.advanceTimersByTimeAsync(150);

    expect(flushes).toHaveLength(1);
    expect(flushes[0]?.texts).toEqual(["hello", "how are you", "?"]);
  });

  it("isolates buffers per chat", async () => {
    const flushes: BufferedGroup[] = [];
    const buf = new MessageBuffer({
      windowMs: 100,
      maxWindowMs: 500,
      onFlush: (g) => {
        flushes.push(g);
      },
    });

    buf.push("chat-a", "hi a");
    buf.push("chat-b", "hi b");

    await vi.advanceTimersByTimeAsync(150);

    expect(flushes).toHaveLength(2);
    const chats = flushes.map((f) => f.chatId).sort();
    expect(chats).toEqual(["chat-a", "chat-b"]);
  });

  it("flushes when the hard ceiling is reached", async () => {
    const flushes: BufferedGroup[] = [];
    const buf = new MessageBuffer({
      windowMs: 100,
      maxWindowMs: 300,
      onFlush: (g) => {
        flushes.push(g);
      },
    });

    buf.push("chat-1", "1");
    await vi.advanceTimersByTimeAsync(80);
    buf.push("chat-1", "2");
    await vi.advanceTimersByTimeAsync(80);
    buf.push("chat-1", "3");
    await vi.advanceTimersByTimeAsync(80);
    buf.push("chat-1", "4");
    await vi.advanceTimersByTimeAsync(80);

    expect(flushes.length).toBeGreaterThanOrEqual(1);
    const combined = flushes.flatMap((f) => f.texts);
    expect(combined).toContain("1");
    expect(combined).toContain("4");
  });

  it("rejects maxWindowMs smaller than windowMs", () => {
    expect(
      () =>
        new MessageBuffer({
          windowMs: 1000,
          maxWindowMs: 500,
          onFlush: () => {},
        }),
    ).toThrow();
  });

  it("close cancels pending timers", () => {
    const onFlush = vi.fn();
    const buf = new MessageBuffer({
      windowMs: 100,
      maxWindowMs: 500,
      onFlush,
    });

    buf.push("chat-1", "never flushed");
    buf.close();
    vi.advanceTimersByTime(500);

    expect(onFlush).not.toHaveBeenCalled();
  });
});
