import { contextBridge, ipcRenderer } from "electron";
import type { ClipboardItem } from "../models/ClipboardItem.ts";

contextBridge.exposeInMainWorld("electronAPI", {
  getClipboardHistory: () => ipcRenderer.invoke("get-clipboard-history"),
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
});
