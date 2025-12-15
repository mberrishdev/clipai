import type { ClipboardItem } from "../models/ClipboardItem";

export interface AppConfig {
  globalShortcut: string;
  transparency: boolean;
  openaiApiKey?: string;
  retentionPeriodDays: number;
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
  navigate: (page: string) => Promise<void>;
  // Archive methods
  getArchivedHistory: (limit: number, offset: number) => Promise<ClipboardItem[]>;
  unarchiveItem: (id: number) => Promise<{ success: boolean; error?: string }>;
  deleteArchivedItem: (id: number) => Promise<{ success: boolean; error?: string }>;
  clearArchive: () => Promise<{ success: boolean; error?: string }>;
  setRetentionPeriod: (days: number) => Promise<{ success: boolean; error?: string }>;
  archiveOldItems: () => Promise<{ success: boolean; count?: number; error?: string }>;
  semanticSearchArchive: (query: string, limit?: number) => Promise<ClipboardItem[]>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
