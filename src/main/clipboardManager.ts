import { clipboard, BrowserWindow, nativeImage } from "electron";
import type { ClipboardItem } from "../models/ClipboardItem.ts";

export class ClipboardManager {
  private history: ClipboardItem[] = [];
  private lastClipboardText = "";
  private lastClipboardImage = "";
  private intervalId: NodeJS.Timeout | null = null;
  private window: BrowserWindow | null = null;

  constructor(window: BrowserWindow) {
    this.window = window;
  }

  start() {
    this.intervalId = setInterval(() => {
      const image = clipboard.readImage();

      if (!image.isEmpty()) {
        const imageDataURL = image.toDataURL();

        if (imageDataURL !== this.lastClipboardImage) {
          this.lastClipboardImage = imageDataURL;
          const item: ClipboardItem = {
            type: 'image',
            image: imageDataURL,
            timestamp: Date.now(),
          };
          this.history.unshift(item);

          if (this.window) {
            this.window.webContents.send("clipboard-update", item);
          }
        }
      } else {
        const text = clipboard.readText();
        const trimmedText = text.trim();

        if (trimmedText && text !== this.lastClipboardText) {
          this.lastClipboardText = text;
          const item: ClipboardItem = {
            type: 'text',
            text,
            timestamp: Date.now(),
          };
          this.history.unshift(item);

          if (this.window) {
            this.window.webContents.send("clipboard-update", item);
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
