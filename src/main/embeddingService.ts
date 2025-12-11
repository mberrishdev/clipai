import OpenAI from "openai";
import log from "electron-log";
import type { ConfigManager } from "./configManager.ts";

export class EmbeddingService {
  private openai: OpenAI | null = null;
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    const apiKey = this.configManager.getOpenAIApiKey();
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      log.info("OpenAI client initialized");
    } else {
      this.openai = null;
      log.warn("OpenAI API key not configured");
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      const apiKey = this.configManager.getOpenAIApiKey();
      if (!apiKey) {
        throw new Error("OpenAI API key not configured. Please add your API key in settings.");
      }
      this.initializeOpenAI();
    }

    try {
      const response = await this.openai!.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      if (!response.data || response.data.length === 0 || !response.data[0]) {
        throw new Error("No embedding data received from OpenAI");
      }

      return response.data[0].embedding;
    } catch (error) {
      log.error("Failed to get embedding:", error);
      throw error;
    }
  }

  // Call this when API key is updated
  refreshApiKey(): void {
    this.initializeOpenAI();
  }
}
