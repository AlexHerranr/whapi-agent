export interface BufferedGroup {
  chatId: string;
  texts: string[];
  firstAt: number;
}

export type FlushHandler = (group: BufferedGroup) => void | Promise<void>;

export interface MessageBufferOptions {
  windowMs: number;
  maxWindowMs: number;
  onFlush: FlushHandler;
}

interface BufferState {
  texts: string[];
  firstAt: number;
  timer: NodeJS.Timeout;
}

export class MessageBuffer {
  private readonly buffers = new Map<string, BufferState>();
  private readonly windowMs: number;
  private readonly maxWindowMs: number;
  private readonly onFlush: FlushHandler;

  constructor(opts: MessageBufferOptions) {
    if (opts.maxWindowMs < opts.windowMs) {
      throw new Error("maxWindowMs must be >= windowMs");
    }
    this.windowMs = opts.windowMs;
    this.maxWindowMs = opts.maxWindowMs;
    this.onFlush = opts.onFlush;
  }

  push(chatId: string, text: string): void {
    const now = Date.now();
    const existing = this.buffers.get(chatId);

    if (!existing) {
      const state: BufferState = {
        texts: [text],
        firstAt: now,
        timer: setTimeout(() => this.flush(chatId), this.windowMs),
      };
      this.buffers.set(chatId, state);
      return;
    }

    existing.texts.push(text);
    clearTimeout(existing.timer);

    const age = now - existing.firstAt;
    if (age >= this.maxWindowMs) {
      this.flush(chatId);
      return;
    }

    const remainingByCap = this.maxWindowMs - age;
    const nextWait = Math.min(this.windowMs, remainingByCap);
    existing.timer = setTimeout(() => this.flush(chatId), nextWait);
  }

  flushNow(chatId: string): void {
    this.flush(chatId);
  }

  size(chatId: string): number {
    return this.buffers.get(chatId)?.texts.length ?? 0;
  }

  activeChats(): number {
    return this.buffers.size;
  }

  close(): void {
    for (const state of this.buffers.values()) {
      clearTimeout(state.timer);
    }
    this.buffers.clear();
  }

  private flush(chatId: string): void {
    const state = this.buffers.get(chatId);
    if (!state) return;
    clearTimeout(state.timer);
    this.buffers.delete(chatId);

    const group: BufferedGroup = {
      chatId,
      texts: [...state.texts],
      firstAt: state.firstAt,
    };
    void Promise.resolve()
      .then(() => this.onFlush(group))
      .catch(() => {
        // handler must not throw; swallow here to protect the event loop
      });
  }
}
