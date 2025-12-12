import Database from "better-sqlite3";
import { app } from "electron";
import { join } from "path";
import log from "electron-log";
import * as sqliteVec from "sqlite-vec";
import type { ClipboardItem } from "../models/ClipboardItem.ts";

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    const userDataPath = app.getPath("userData");
    const dbPath = join(userDataPath, "clipboard.db");
    log.info("Database path:", dbPath);

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");

    sqliteVec.load(this.db);
    log.info("sqlite-vec extension loaded");

    this.initTables();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clipboard_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        text TEXT,
        image TEXT,
        timestamp INTEGER NOT NULL,
        embedding BLOB,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON clipboard_items(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_type ON clipboard_items(type);
    `);
    log.info("Database tables initialized");
  }

  addItem(item: Omit<ClipboardItem, "id">): number {
    // If embedding exists, insert with vec_f32, otherwise insert without it
    if (item.embedding && item.embedding.length > 0) {
      const stmt = this.db.prepare(`
        INSERT INTO clipboard_items (type, text, image, timestamp, embedding)
        VALUES (?, ?, ?, ?, vec_f32(?))
      `);

      const embeddingBlob = Buffer.from(
        new Float32Array(item.embedding).buffer
      );

      const result = stmt.run(
        item.type,
        item.text || null,
        item.image || null,
        item.timestamp,
        embeddingBlob
      );

      return result.lastInsertRowid as number;
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO clipboard_items (type, text, image, timestamp)
        VALUES (?, ?, ?, ?)
      `);

      const result = stmt.run(
        item.type,
        item.text || null,
        item.image || null,
        item.timestamp
      );

      return result.lastInsertRowid as number;
    }
  }

  getItems(limit: number = 1000, offset: number = 0): ClipboardItem[] {
    const stmt = this.db.prepare(`
      SELECT id, type, text, image, timestamp
      FROM clipboard_items
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(limit, offset) as ClipboardItem[];
  }

  getItemById(id: number): ClipboardItem | undefined {
    const stmt = this.db.prepare(`
      SELECT id, type, text, image, timestamp
      FROM clipboard_items
      WHERE id = ?
    `);

    return stmt.get(id) as ClipboardItem | undefined;
  }

  deleteItem(id: number): boolean {
    const stmt = this.db.prepare("DELETE FROM clipboard_items WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  clearAll(): void {
    this.db.exec("DELETE FROM clipboard_items");
    log.info("All clipboard items cleared");
  }

  getStats(): { total: number; text: number; image: number } {
    const result = this.db
      .prepare(
        `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN type = 'text' THEN 1 ELSE 0 END) as text,
          SUM(CASE WHEN type = 'image' THEN 1 ELSE 0 END) as image
        FROM clipboard_items
      `
      )
      .get() as { total: number; text: number; image: number };

    return result;
  }

  searchItems(query: string, limit: number = 100): ClipboardItem[] {
    const stmt = this.db.prepare(`
      SELECT id, type, text, image, timestamp
      FROM clipboard_items
      WHERE text LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    return stmt.all(`%${query}%`, limit) as ClipboardItem[];
  }

  updateItemEmbedding(id: number, embedding: number[]): void {
    const stmt = this.db.prepare(`
      UPDATE clipboard_items
      SET embedding = vec_f32(?)
      WHERE id = ?
    `);

    const embeddingBlob = Buffer.from(new Float32Array(embedding).buffer);
    stmt.run(embeddingBlob, id);
  }

  semanticSearch(
    queryEmbedding: number[],
    limit: number = 10
  ): ClipboardItem[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        type,
        text,
        image,
        timestamp,
        vec_distance_cosine(embedding, vec_f32(?)) as distance
      FROM clipboard_items
      WHERE embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT ?
    `);

    const embeddingBlob = Buffer.from(new Float32Array(queryEmbedding).buffer);
    return stmt.all(embeddingBlob, limit) as ClipboardItem[];
  }

  close() {
    this.db.close();
    log.info("Database closed");
  }
}
