export interface ElectronAPI {
  getClipboardHistory: () => Promise<string[]>;
  onClipboardUpdate: (callback: (text: string) => void) => void;
  onNavigate: (callback: (page: string) => void) => void;
  setTransparency: (enabled: boolean) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
