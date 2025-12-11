import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  shell,
  globalShortcut,
} from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ClipboardManager } from "./clipboardManager.ts";
import { ConfigManager } from "./configManager.ts";
import { DatabaseManager } from "./database.ts";
import log from "electron-log";
import { EmbeddingService } from "./embeddingService.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

log.initialize({ preload: true });
log.transports.file.level = "info";
log.transports.console.level = "info";
log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";

log.info("=".repeat(80));
log.info("App starting...");
log.info("Platform:", process.platform);
log.info("App version:", app.getVersion());
log.info("Electron version:", process.versions.electron);
log.info("=".repeat(80));

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let clipboardManager: ClipboardManager | null = null;
let configManager: ConfigManager | null = null;
let databaseManager: DatabaseManager | null = null;
let embeddingService: EmbeddingService | null = null;
let isQuitting = false;

async function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    transparent: true,
    resizable: false,
    frame: false,
    hasShadow: false,
    vibrancy: "fullscreen-ui",
    backgroundMaterial: "acrylic",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-inline' data: blob:; img-src 'self' data: blob:;",
        ],
      },
    });
  });

  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
    }
  });

  win.on("blur", () => {
    win?.hide();
  });

  try {
    if (!app.isPackaged) {
      await win.loadURL("http://localhost:5173");
      //win.webContents.openDevTools();
    } else {
      const htmlPath = join(__dirname, "../renderer/index.html");
      await win.loadFile(htmlPath);
    }
  } catch (error) {
    log.error("Failed to load content:", error);
  }

  clipboardManager = new ClipboardManager(
    win,
    databaseManager!,
    embeddingService!
  );
  clipboardManager.start();
}

function createTray() {
  try {
    const iconName =
      process.platform === "darwin" ? "trayIconTemplate.png" : "icon.png";
    const iconPath = join(__dirname, "../../assets", iconName);
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show Clipboard History",
        click: () => {
          try {
            win?.show();
            win?.focus();
            win?.webContents.send("navigate", "history");
          } catch (error) {
            log.error("Error in menu click:", error);
          }
        },
      },
      {
        label: "Settings",
        click: () => {
          win?.show();
          win?.webContents.send("navigate", "settings");
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip("Clipboard Manager");

    tray.on("click", () => {
      const isVisible = win?.isVisible();
      if (isVisible) {
        win?.hide();
      } else {
        win?.show();
        win?.focus();
      }
    });

    tray.on("right-click", () => {
      tray?.popUpContextMenu(contextMenu);
    });
  } catch (error) {
    log.error("Failed to create tray:", error);
  }
}

ipcMain.handle("get-clipboard-history", () => {
  return clipboardManager?.getHistory() || [];
});

ipcMain.handle("load-more-history", (_event, limit: number = 50) => {
  return clipboardManager?.loadMore(limit) || [];
});

ipcMain.handle(
  "semantic-search",
  async (_event, query: string, limit: number = 10) => {
    try {
      if (!clipboardManager) {
        throw new Error("ClipboardManager not initialized");
      }
      return await clipboardManager.semanticSearch(query, limit);
    } catch (error) {
      log.error("Failed to perform semantic search:", error);
      throw error;
    }
  }
);

ipcMain.handle("set-transparency", (_event, enabled: boolean) => {
  if (win) {
    win.webContents.send("transparency-changed", enabled);
  }
});

ipcMain.handle("open-external-url", async (_event, url: string) => {
  try {
    await shell.openExternal(url);
  } catch (error) {
    log.error("Failed to open external URL:", error);
    throw error;
  }
});

ipcMain.handle("get-config", () => {
  return (
    configManager?.getConfig() || {
      globalShortcut: "CommandOrControl+Shift+V",
      transparency: true,
    }
  );
});

ipcMain.handle("set-global-shortcut", (_event, shortcut: string) => {
  try {
    const success = registerGlobalShortcut(shortcut);
    if (success) {
      configManager?.setGlobalShortcut(shortcut);
      return { success: true };
    } else {
      return { success: false, error: "Failed to register shortcut" };
    }
  } catch (error) {
    log.error("Failed to set global shortcut:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("set-openai-api-key", (_event, apiKey: string) => {
  try {
    configManager?.setOpenAIApiKey(apiKey);
    embeddingService?.refreshApiKey();
    log.info("OpenAI API key updated");
    return { success: true };
  } catch (error) {
    log.error("Failed to set OpenAI API key:", error);
    return { success: false, error: String(error) };
  }
});

function registerGlobalShortcut(shortcut: string = "CommandOrControl+Shift+V") {
  globalShortcut.unregisterAll();

  const registered = globalShortcut.register(shortcut, () => {
    log.info("Global shortcut triggered:", shortcut);
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  });

  if (registered) {
    log.info("Global shortcut registered:", shortcut);
  } else {
    log.error("Failed to register global shortcut:", shortcut);
  }

  return registered;
}

app.whenReady().then(() => {
  log.info("App ready");

  configManager = new ConfigManager();
  databaseManager = new DatabaseManager();
  embeddingService = new EmbeddingService(configManager);

  app.setLoginItemSettings({
    openAtLogin: true,
  });

  if (app.dock) {
    app.dock.hide();
  }

  createWindow();
  createTray();

  const config = configManager.getConfig();
  registerGlobalShortcut(config.globalShortcut);

  if (!app.isPackaged) {
    win?.show();
  }
});

app.on("window-all-closed", () => {});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
