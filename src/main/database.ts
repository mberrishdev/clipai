import Database from "better-sqlite3";
import { app } from "electron";
import { join } from "path";
import log from "electron-log";
import type { ClipboardItem } from "../models/ClipboardItem.ts";

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    const userDataPath = app.getPath("userData");
    const dbPath = join(userDataPath, "clipboard.db");
    log.info("Database path:", dbPath);

    try {
      log.info("Opening database...");
      this.db = new Database(dbPath);
      log.info("Database opened successfully");

      log.info("Setting journal mode...");
      this.db.pragma("journal_mode = WAL");
      log.info("Journal mode set");

      log.info("Loading sqlite-vec extension...");
      const sqliteVec = require("sqlite-vec");
      let loadablePath = sqliteVec.getLoadablePath();

      // Fix path for Electron asar packaging
      if (loadablePath.includes(".asar")) {
        loadablePath = loadablePath.replace(
          "app.asar" +
            (process.platform === "win32" ? "\\" : "/") +
            "node_modules",
          "app.asar.unpacked" +
            (process.platform === "win32" ? "\\" : "/") +
            "node_modules"
        );
      }

      log.info("Loading sqlite-vec from:", loadablePath);
      this.db.loadExtension(loadablePath);
      log.info("sqlite-vec extension loaded");

      log.info("Initializing tables...");
      this.initTables();
      log.info("Database initialization complete");
    } catch (error) {
      log.error("Database initialization error:", error);
      throw error;
    }
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS clipboard_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        text TEXT,
        image TEXT,
        file_path TEXT,
        file_name TEXT,
        timestamp INTEGER NOT NULL,
        embedding BLOB,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON clipboard_items(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_type ON clipboard_items(type);

      CREATE TABLE IF NOT EXISTS archived_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        text TEXT,
        image TEXT,
        file_path TEXT,
        file_name TEXT,
        timestamp INTEGER NOT NULL,
        embedding BLOB,
        archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME
      );

      CREATE INDEX IF NOT EXISTS idx_archived_timestamp ON archived_items(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_archived_at ON archived_items(archived_at DESC);
      CREATE INDEX IF NOT EXISTS idx_archived_type ON archived_items(type);
    `);

    // Add columns to existing tables if they don't exist
    try {
      this.db.exec(`ALTER TABLE clipboard_items ADD COLUMN file_path TEXT`);
      log.info("Added file_path column to clipboard_items");
    } catch (error) {
      // Column already exists, ignore
    }

    try {
      this.db.exec(`ALTER TABLE clipboard_items ADD COLUMN file_name TEXT`);
      log.info("Added file_name column to clipboard_items");
    } catch (error) {
      // Column already exists, ignore
    }

    try {
      this.db.exec(`ALTER TABLE archived_items ADD COLUMN file_path TEXT`);
      log.info("Added file_path column to archived_items");
    } catch (error) {
      // Column already exists, ignore
    }

    try {
      this.db.exec(`ALTER TABLE archived_items ADD COLUMN file_name TEXT`);
      log.info("Added file_name column to archived_items");
    } catch (error) {
      // Column already exists, ignore
    }

    log.info("Database tables initialized");
  }

  addItem(item: Omit<ClipboardItem, "id">): number {
    // If embedding exists, insert with vec_f32, otherwise insert without it
    if (item.embedding && item.embedding.length > 0) {
      const stmt = this.db.prepare(`
        INSERT INTO clipboard_items (type, text, image, file_path, file_name, timestamp, embedding)
        VALUES (?, ?, ?, ?, ?, ?, vec_f32(?))
      `);

      const embeddingBlob = Buffer.from(
        new Float32Array(item.embedding).buffer
      );

      const result = stmt.run(
        item.type,
        item.text || null,
        item.image || null,
        item.filePath || null,
        item.fileName || null,
        item.timestamp,
        embeddingBlob
      );

      return result.lastInsertRowid as number;
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO clipboard_items (type, text, image, file_path, file_name, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        item.type,
        item.text || null,
        item.image || null,
        item.filePath || null,
        item.fileName || null,
        item.timestamp
      );

      return result.lastInsertRowid as number;
    }
  }

  getItems(limit: number = 1000, offset: number = 0): ClipboardItem[] {
    const stmt = this.db.prepare(`
      SELECT id, type, text, image, file_path as filePath, file_name as fileName, timestamp
      FROM clipboard_items
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(limit, offset) as ClipboardItem[];
  }

  getItemById(id: number): ClipboardItem | undefined {
    const stmt = this.db.prepare(`
      SELECT id, type, text, image, file_path as filePath, file_name as fileName, timestamp
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
      SELECT id, type, text, image, file_path as filePath, file_name as fileName, timestamp
      FROM clipboard_items
      WHERE text LIKE ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    return stmt.all(`%${query}%`, limit) as ClipboardItem[];
  }

  clearAllHistory(): void {
    this.db.exec("DELETE FROM clipboard_items");
    log.info("Clipboard history cleared");
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
        file_path as filePath,
        file_name as fileName,
        timestamp,
        vec_distance_cosine(embedding, vec_f32(?)) as distance
      FROM clipboard_items
      WHERE embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT ?
    `);

    return stmt.all(JSON.stringify(queryEmbedding), limit) as ClipboardItem[];
  }

  archiveOldItems(retentionDays: number): number {
    const cutoffTimestamp = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    const insertStmt = this.db.prepare(`
      INSERT INTO archived_items (original_id, type, text, image, file_path, file_name, timestamp, embedding, created_at)
      SELECT id, type, text, image, file_path, file_name, timestamp, embedding, created_at
      FROM clipboard_items
      WHERE timestamp < ?
    `);

    const result = insertStmt.run(cutoffTimestamp);

    if (result.changes > 0) {
      const deleteStmt = this.db.prepare(`
        DELETE FROM clipboard_items WHERE timestamp < ?
      `);
      deleteStmt.run(cutoffTimestamp);
    }

    log.info(
      `Archived ${result.changes} items older than ${retentionDays} days`
    );
    return result.changes;
  }

  getArchivedItems(limit: number = 1000, offset: number = 0): ClipboardItem[] {
    const stmt = this.db.prepare(`
      SELECT id, type, text, image, file_path as filePath, file_name as fileName, timestamp
      FROM archived_items
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);

    return stmt.all(limit, offset) as ClipboardItem[];
  }

  unarchiveItem(id: number): boolean {
    const insertStmt = this.db.prepare(`
      INSERT INTO clipboard_items (type, text, image, file_path, file_name, timestamp, embedding)
      SELECT type, text, image, file_path, file_name, timestamp, embedding
      FROM archived_items
      WHERE id = ?
    `);

    const result = insertStmt.run(id);

    if (result.changes > 0) {
      const deleteStmt = this.db.prepare(`
        DELETE FROM archived_items WHERE id = ?
      `);
      deleteStmt.run(id);
      log.info(`Unarchived item ${id}`);
      return true;
    }

    return false;
  }

  deleteArchivedItem(id: number): boolean {
    const stmt = this.db.prepare("DELETE FROM archived_items WHERE id = ?");
    const result = stmt.run(id);
    if (result.changes > 0) {
      log.info(`Permanently deleted archived item ${id}`);
    }
    return result.changes > 0;
  }

  clearArchive(): void {
    this.db.exec("DELETE FROM archived_items");
    log.info("All archived items cleared");
  }

  getArchiveStats(): { total: number; text: number; image: number } {
    const result = this.db
      .prepare(
        `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN type = 'text' THEN 1 ELSE 0 END) as text,
          SUM(CASE WHEN type = 'image' THEN 1 ELSE 0 END) as image
        FROM archived_items
      `
      )
      .get() as { total: number; text: number; image: number };

    return result;
  }

  semanticSearchArchive(
    queryEmbedding: number[],
    limit: number = 10
  ): ClipboardItem[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        type,
        text,
        image,
        file_path as filePath,
        file_name as fileName,
        timestamp,
        vec_distance_cosine(embedding, vec_f32(?)) as distance
      FROM archived_items
      WHERE embedding IS NOT NULL
      ORDER BY distance ASC
      LIMIT ?
    `);

    return stmt.all(JSON.stringify(queryEmbedding), limit) as ClipboardItem[];
  }

  close() {
    this.db.close();
    log.info("Database closed");
  }
}
