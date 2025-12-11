import { clipboard, BrowserWindow, nativeImage } from "electron";
import type { ClipboardItem } from "../models/ClipboardItem.ts";
import type { DatabaseManager } from "./database.ts";
import log from "electron-log";

export class ClipboardManager {
  private history: ClipboardItem[] = [];
  private lastClipboardText = "";
  private lastClipboardImage = "";
  private intervalId: NodeJS.Timeout | null = null;
  private window: BrowserWindow | null = null;
  private db: DatabaseManager;

  constructor(window: BrowserWindow, database: DatabaseManager) {
    this.window = window;
    this.db = database;
    this.loadHistoryFromDB();
  }

  private loadHistoryFromDB() {
    try {
      const stats = this.db.getStats();
      log.info(`Database stats:`, stats);

      this.history = this.db.getItems(15);
      log.info(`Loaded ${this.history.length} items from database (initial load)`);

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
      log.info(`loadMore called: offset=${offset}, limit=${limit}`);

      const moreItems = this.db.getItems(limit, offset);
      this.history.push(...moreItems);
      log.info(
        `Loaded ${moreItems.length} more items (offset was ${offset}, total now: ${this.history.length})`
      );
      return moreItems;
    } catch (error) {
      log.error("Failed to load more items from database:", error);
      return [];
    }
  }

  start() {
    this.intervalId = setInterval(() => {
      const image = clipboard.readImage();

      if (!image.isEmpty()) {
        const imageDataURL = image.toDataURL();

        if (imageDataURL !== this.lastClipboardImage) {
          this.lastClipboardImage = imageDataURL;
          const item: ClipboardItem = {
            type: "image",
            image: imageDataURL,
            timestamp: Date.now(),
          };

          // Save to database
          try {
            const id = this.db.addItem(item);
            item.id = id;
            this.history.unshift(item);

            if (this.window) {
              this.window.webContents.send("clipboard-update", item);
            }
            log.info(`Image clipboard item saved to DB with id: ${id}`);
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
          const item: ClipboardItem = {
            type: "text",
            text,
            timestamp: Date.now(),
          };

          // Save to database
          try {
            const id = this.db.addItem(item);
            item.id = id;
            this.history.unshift(item);

            if (this.window) {
              this.window.webContents.send("clipboard-update", item);
            }
            log.info(`Text clipboard item saved to DB with id: ${id}`);
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

  clear() {
    this.history = [];
  }
}
