export interface ClipboardItem {
  id?: number;
  type: "text" | "image";
  text?: string;
  image?: string;
  timestamp: number;
  embedding?: number[];
}
