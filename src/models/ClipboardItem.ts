export interface ClipboardItem {
  type: 'text' | 'image';
  text?: string;
  image?: string;
  timestamp: number;
}
