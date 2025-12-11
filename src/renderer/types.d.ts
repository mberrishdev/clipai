import type { ClipboardItem } from "../models/ClipboardItem";

export interface AppConfig {
  globalShortcut: string;
  transparency: boolean;
}

export interface ElectronAPI {
  getClipboardHistory: () => Promise<ClipboardItem[]>;
  loadMoreHistory: (limit: number) => Promise<ClipboardItem[]>;
  onClipboardUpdate: (callback: (item: ClipboardItem) => void) => void;
  onNavigate: (callback: (page: string) => void) => void;
  setTransparency: (enabled: boolean) => Promise<void>;
  openExternalURL: (url: string) => Promise<void>;
  getConfig: () => Promise<AppConfig>;
  setGlobalShortcut: (shortcut: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
