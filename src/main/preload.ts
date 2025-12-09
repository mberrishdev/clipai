import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getClipboardHistory: () => ipcRenderer.invoke("get-clipboard-history"),
  onClipboardUpdate: (callback: (text: string) => void) => {
    ipcRenderer.on("clipboard-update", (_event, text) => callback(text));
  },
  onNavigate: (callback: (page: string) => void) => {
    ipcRenderer.on("navigate", (_event, page) => callback(page));
  },
  setTransparency: (enabled: boolean) =>
    ipcRenderer.invoke("set-transparency", enabled),
});
