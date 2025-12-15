import type { ClipboardItem } from "../models/ClipboardItem";

export interface AppConfig {
  globalShortcut: string;
  transparency: boolean;
  openaiApiKey?: string;
}

export interface ElectronAPI {
  getClipboardHistory: () => Promise<ClipboardItem[]>;
  loadMoreHistory: (limit: number) => Promise<ClipboardItem[]>;
  semanticSearch: (query: string, limit?: number) => Promise<ClipboardItem[]>;
  onClipboardUpdate: (callback: (item: ClipboardItem) => void) => void;
  onNavigate: (callback: (page: string) => void) => void;
  setTransparency: (enabled: boolean) => Promise<void>;
  openExternalURL: (url: string) => Promise<void>;
  getConfig: () => Promise<AppConfig>;
  setGlobalShortcut: (shortcut: string) => Promise<{ success: boolean; error?: string }>;
  setOpenAIApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  clearHistory: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
