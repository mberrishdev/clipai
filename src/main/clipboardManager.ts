import { clipboard, BrowserWindow } from "electron";
import type { ClipboardItem } from "../models/ClipboardItem.ts";

export class ClipboardManager {
  private history: ClipboardItem[] = [];
  private lastClipboardText = "";
  private intervalId: NodeJS.Timeout | null = null;
  private window: BrowserWindow | null = null;

  constructor(window: BrowserWindow) {
    this.window = window;
  }

  start() {
    this.intervalId = setInterval(() => {
      const text = clipboard.readText();
      const trimmedText = text.trim();

      if (trimmedText && text !== this.lastClipboardText) {
        this.lastClipboardText = text;
        const item: ClipboardItem = {
          text,
          timestamp: Date.now(),
        };
        this.history.unshift(item);

        if (this.window) {
          this.window.webContents.send("clipboard-update", item);
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
