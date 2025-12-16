export interface ClipboardItem {
  id?: number;
  type: "text" | "image" | "file";
  text?: string;
  image?: string;
  filePath?: string;
  fileName?: string;
  timestamp: number;
  embedding?: number[];
}
