import { clipboard, BrowserWindow, type Config } from "electron";
import type { ClipboardItem } from "../models/ClipboardItem.ts";
import type { DatabaseManager } from "./database.ts";
import log from "electron-log";
import type { EmbeddingService } from "./embeddingService.ts";
import type { ConfigManager } from "./configManager.ts";

export class ClipboardManager {
  private history: ClipboardItem[] = [];
  private lastClipboardText = "";
  private lastClipboardImage = "";
  private intervalId: NodeJS.Timeout | null = null;
  private window: BrowserWindow | null = null;
  private db: DatabaseManager;
  private embeddingService: EmbeddingService;
  private configManager: ConfigManager;

  constructor(
    window: BrowserWindow,
    database: DatabaseManager,
    embeddingService: EmbeddingService,
    configManager: ConfigManager
  ) {
    this.window = window;
    this.db = database;
    this.embeddingService = embeddingService;
    this.configManager = configManager;
    this.loadHistoryFromDB();
  }

  public loadHistoryFromDB() {
    try {
      const stats = this.db.getStats();
      log.info(`Database stats:`, stats);

      this.history = this.db.getItems(15);
      log.info(
        `Loaded ${this.history.length} items from database (initial load)`
      );

      if (this.history.length > 0) {
        const lastItem = this.history[0];
        if (lastItem && lastItem.type === "text" && lastItem.text) {
          this.lastClipboardText = lastItem.text;
        } else if (lastItem && lastItem.type === "image" && lastItem.image) {
          this.lastClipboardImage = lastItem.image;
        }
      }
    } catch (error) {
      log.error("Failed to load history from database:", error);
    }
  }

  loadMore(limit: number = 20): ClipboardItem[] {
    try {
      const offset = this.history.length;
      const moreItems = this.db.getItems(limit, offset);
      this.history.push(...moreItems);
      log.info(
        `Loaded ${moreItems.length} more items (total: ${this.history.length})`
      );
      return moreItems;
    } catch (error) {
      log.error("Failed to load more items from database:", error);
      return [];
    }
  }

  start() {
    this.intervalId = setInterval(async () => {
      const image = clipboard.readImage();

      if (!image.isEmpty()) {
        const imageDataURL = image.toDataURL();

        if (imageDataURL !== this.lastClipboardImage) {
          this.lastClipboardImage = imageDataURL;
          const item: ClipboardItem = {
            type: "image",
            image: imageDataURL,
            timestamp: Date.now(),
            embedding: [],
          };

          // Save to database
          try {
            const id = this.db.addItem(item);
            item.id = id;
            this.history.unshift(item);

            if (this.window) {
              this.window.webContents.send("clipboard-update", item);
            }
          } catch (error) {
            log.error("Failed to save image to database:", error);
            // Still add to memory even if DB fails
            this.history.unshift(item);
            if (this.window) {
              this.window.webContents.send("clipboard-update", item);
            }
          }
        }
      } else {
        const text = clipboard.readText();
        const trimmedText = text.trim();

        if (trimmedText && text !== this.lastClipboardText) {
          this.lastClipboardText = text;

          let embedding: number[] | undefined;
          if (this.configManager.isApiKeyConfigured()) {
            embedding = await this.embeddingService.getEmbedding(trimmedText);
          } else {
            embedding = undefined;
          }

          const item: ClipboardItem = {
            type: "text",
            text,
            timestamp: Date.now(),
            embedding,
          };

          // Save to database
          try {
            const id = this.db.addItem(item);
            item.id = id;
            this.history.unshift(item);

            if (this.window) {
              this.window.webContents.send("clipboard-update", item);
            }
          } catch (error) {
            log.error("Failed to save text to database:", error);
            // Still add to memory even if DB fails
            this.history.unshift(item);
            if (this.window) {
              this.window.webContents.send("clipboard-update", item);
            }
          }
        }
      }
    }, 500);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  getHistory(): ClipboardItem[] {
    return this.history;
  }

  async semanticSearch(
    query: string,
    limit: number = 10
  ): Promise<ClipboardItem[]> {
    try {
      log.info(`Performing semantic search for: "${query}"`);

      const queryEmbedding = await this.embeddingService.getEmbedding(query);

      const results = this.db.semanticSearch(queryEmbedding, limit);
      log.info(`Found ${results.length} results`);

      return results;
    } catch (error) {
      log.error("Failed to perform semantic search:", error);
      throw error;
    }
  }

  clear() {
    this.history = [];
  }
}
