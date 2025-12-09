import { clipboard, BrowserWindow } from "electron";

export class ClipboardManager {
  private history: string[] = [];
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
        this.history.unshift(text);

        if (this.window) {
          this.window.webContents.send("clipboard-update", text);
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

  getHistory(): string[] {
    return this.history;
  }

  clear() {
    this.history = [];
  }
}
