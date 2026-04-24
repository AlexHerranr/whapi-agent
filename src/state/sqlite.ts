import Database from "better-sqlite3";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";
import { StateError } from "../utils/errors.js";
import type {
  ConversationRole,
  ConversationStore,
  StoredMessage,
} from "./store.js";

export interface SqliteStoreOptions {
  path: string;
  historyMaxMessages: number;
}

export class SqliteStore implements ConversationStore {
  private readonly db: Database.Database;
  private readonly historyMax: number;

  constructor(opts: SqliteStoreOptions) {
    try {
      mkdirSync(dirname(opts.path), { recursive: true });
      this.db = new Database(opts.path);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("foreign_keys = ON");
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id    TEXT    NOT NULL,
          role       TEXT    NOT NULL CHECK (role IN ('user','assistant')),
          content    TEXT    NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_messages_chat_time
          ON messages (chat_id, created_at DESC);
      `);
      this.historyMax = opts.historyMaxMessages;
    } catch (err) {
      throw new StateError("failed to open sqlite store", err);
    }
  }

  async load(chatId: string, limit?: number): Promise<StoredMessage[]> {
    const cap = limit ?? this.historyMax;
    const rows = this.db
      .prepare(
        `SELECT role, content, created_at
           FROM messages
          WHERE chat_id = ?
          ORDER BY created_at DESC
          LIMIT ?`,
      )
      .all(chatId, cap) as {
      role: ConversationRole;
      content: string;
      created_at: number;
    }[];
    return rows
      .map((r) => ({
        role: r.role,
        content: r.content,
        createdAt: r.created_at,
      }))
      .reverse();
  }

  async append(chatId: string, message: StoredMessage): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO messages (chat_id, role, content, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(chatId, message.role, message.content, message.createdAt);
  }

  async clear(chatId: string): Promise<void> {
    this.db.prepare("DELETE FROM messages WHERE chat_id = ?").run(chatId);
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
