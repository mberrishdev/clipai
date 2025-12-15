import { contextBridge, ipcRenderer } from "electron";
import type { ClipboardItem } from "../models/ClipboardItem.ts";

contextBridge.exposeInMainWorld("electronAPI", {
  getClipboardHistory: () => ipcRenderer.invoke("get-clipboard-history"),
  loadMoreHistory: (limit: number) =>
    ipcRenderer.invoke("load-more-history", limit),
  semanticSearch: (query: string, limit?: number) =>
    ipcRenderer.invoke("semantic-search", query, limit),
  onClipboardUpdate: (callback: (item: ClipboardItem) => void) => {
    ipcRenderer.on("clipboard-update", (_event, item) => callback(item));
  },
  onNavigate: (callback: (page: string) => void) => {
    ipcRenderer.on("navigate", (_event, page) => callback(page));
  },
  setTransparency: (enabled: boolean) =>
    ipcRenderer.invoke("set-transparency", enabled),
  openExternalURL: (url: string) =>
    ipcRenderer.invoke("open-external-url", url),
  getConfig: () => ipcRenderer.invoke("get-config"),
  setGlobalShortcut: (shortcut: string) =>
    ipcRenderer.invoke("set-global-shortcut", shortcut),
  setOpenAIApiKey: (apiKey: string) =>
    ipcRenderer.invoke("set-openai-api-key", apiKey),
  clearHistory: () => ipcRenderer.invoke("clear-history"),
  navigate: (page: string) => ipcRenderer.invoke("navigate-to", page),
});
