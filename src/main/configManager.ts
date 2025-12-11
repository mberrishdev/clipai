import { app } from "electron";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import log from "electron-log";

export interface AppConfig {
  globalShortcut: string;
  transparency: boolean;
  openaiApiKey?: string;
}

const DEFAULT_CONFIG: AppConfig = {
  globalShortcut: "CommandOrControl+Shift+V",
  transparency: true,
  openaiApiKey: undefined,
};

export class ConfigManager {
  private configPath: string;
  private config: AppConfig;

  constructor() {
    const userDataPath = app.getPath("userData");
    this.configPath = join(userDataPath, "config.json");
    log.info("Config path:", this.configPath);
    this.config = this.loadConfig();
  }

  private loadConfig(): AppConfig {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, "utf-8");
        const loadedConfig = JSON.parse(data);
        log.info("Config loaded:", loadedConfig);
        return { ...DEFAULT_CONFIG, ...loadedConfig };
      }
    } catch (error) {
      log.error("Failed to load config:", error);
    }
    log.info("Using default config");
    return { ...DEFAULT_CONFIG };
  }

  private saveConfig(): void {
    try {
      const userDataPath = app.getPath("userData");
      if (!existsSync(userDataPath)) {
        mkdirSync(userDataPath, { recursive: true });
      }
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      log.info("Config saved:", this.config);
    } catch (error) {
      log.error("Failed to save config:", error);
    }
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  setGlobalShortcut(shortcut: string): void {
    this.config.globalShortcut = shortcut;
    this.saveConfig();
  }

  setTransparency(enabled: boolean): void {
    this.config.transparency = enabled;
    this.saveConfig();
  }

  getOpenAIApiKey(): string | undefined {
    return this.config.openaiApiKey;
  }

  setOpenAIApiKey(apiKey: string): void {
    this.config.openaiApiKey = apiKey.trim();
    this.saveConfig();
  }
}
