import type { ClipboardItem } from "../models/ClipboardItem";

export interface ElectronAPI {
  getClipboardHistory: () => Promise<ClipboardItem[]>;
  onClipboardUpdate: (callback: (item: ClipboardItem) => void) => void;
  onNavigate: (callback: (page: string) => void) => void;
  setTransparency: (enabled: boolean) => Promise<void>;
  copyToClipboard: (text: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
