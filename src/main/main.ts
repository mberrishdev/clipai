import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  shell,
  globalShortcut,
  dialog,
  net,
  screen,
} from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync } from "fs";
import { tmpdir } from "os";
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

const GITHUB_REPO = "mberrishdev/clipai";

async function checkForUpdates(silent = false): Promise<void> {
  try {
    const currentVersion = app.getVersion();
    log.info(`Checking for updates. Current version: ${currentVersion}`);

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, "");

    log.info(`Latest version: ${latestVersion}`);

    if (latestVersion > currentVersion) {
      const result = await dialog.showMessageBox({
        type: "info",
        title: "Update Available",
        message: `A new version is available!`,
        detail: `Current: v${currentVersion}\nLatest: v${latestVersion}\n\nWould you like to download it?`,
        buttons: ["Download", "Later"],
        defaultId: 0,
      });

      if (result.response === 0) {
        shell.openExternal(release.html_url);
      }
    } else if (!silent) {
      dialog.showMessageBox({
        type: "info",
        title: "No Updates",
        message: "You're up to date!",
        detail: `Current version: v${currentVersion}`,
      });
    }
  } catch (error) {
    log.error("Failed to check for updates:", error);
    if (!silent) {
      dialog.showMessageBox({
        type: "error",
        title: "Update Check Failed",
        message: "Could not check for updates",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    transparent: true,
    resizable: false,
    frame: false,
    hasShadow: true,
    roundedCorners: true,
    vibrancy: "fullscreen-ui",
    backgroundMaterial: "acrylic",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.platform === "darwin") {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

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
    embeddingService!,
    configManager!
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
        label: "Archive",
        click: () => {
          win?.show();
          win?.focus();
          win?.webContents.send("navigate", "archive");
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
        label: "Check for Updates",
        click: () => {
          checkForUpdates(false);
        },
      },
      {
        label: "View Logs",
        click: () => {
          shell.openPath(log.transports.file.getFile().path);
        },
      },
      { type: "separator" },
      {
        label: `Version ${app.getVersion()}`,
        enabled: false,
      },
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

ipcMain.handle("open-image-in-viewer", async (_event, dataURL: string) => {
  try {
    if (!dataURL || typeof dataURL !== "string") {
      throw new Error("Invalid data URL: must be a non-empty string");
    }

    const matches = dataURL.match(/^data:(.+?);base64,(.+)$/);
    if (!matches || matches.length < 3) {
      log.error("Failed to parse data URL. Format:", dataURL.substring(0, 50));
      throw new Error(
        "Invalid data URL format. Expected format: data:image/...;base64,..."
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    if (!base64Data || base64Data.length === 0) {
      throw new Error("Empty base64 data");
    }

    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length === 0 || mimeType === undefined) {
      throw new Error("Failed to decode base64 data");
    }

    const extension = mimeType.split("/")[1] || "png";
    const tempFilePath = join(tmpdir(), `clipboard-${Date.now()}.${extension}`);

    writeFileSync(tempFilePath, buffer);
    log.info("Image saved to:", tempFilePath);

    const result = await shell.openPath(tempFilePath);
    if (result) {
      log.error("Failed to open image:", result);
      throw new Error(result);
    }

    log.info("Image opened successfully");
  } catch (error) {
    log.error("Failed to open image in viewer:", error);
    throw error;
  }
});

ipcMain.handle("open-file-by-path", async (_event, filePath: string) => {
  try {
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid file path: must be a non-empty string");
    }

    log.info("Opening file:", filePath);

    // Open the file with the default application
    const result = await shell.openPath(filePath);
    if (result) {
      log.error("Failed to open file:", result);
      throw new Error(result);
    }

    log.info("File opened successfully");
  } catch (error) {
    log.error("Failed to open file:", error);
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

ipcMain.handle("clear-history", () => {
  try {
    if (!databaseManager) {
      log.error("Database manager not initialized");
      return { success: false, error: "Database not initialized" };
    }
    databaseManager.clearAllHistory();
    clipboardManager?.clear();
    log.info("History cleared by user");
    return { success: true };
  } catch (error) {
    log.error("Failed to clear history:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("navigate-to", (_event, page: string) => {
  if (win) {
    win.webContents.send("navigate", page);
  }
});

// Archive-related IPC handlers
ipcMain.handle(
  "get-archived-history",
  (_event, limit: number = 50, offset: number = 0) => {
    return databaseManager?.getArchivedItems(limit, offset) || [];
  }
);

ipcMain.handle("unarchive-item", (_event, id: number) => {
  try {
    if (!databaseManager) {
      return { success: false, error: "Database not initialized" };
    }
    const success = databaseManager.unarchiveItem(id);
    if (success) {
      // Reload clipboard manager's history
      clipboardManager?.loadHistoryFromDB();
    }
    return { success };
  } catch (error) {
    log.error("Failed to unarchive item:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("delete-archived-item", (_event, id: number) => {
  try {
    if (!databaseManager) {
      return { success: false, error: "Database not initialized" };
    }
    const success = databaseManager.deleteArchivedItem(id);
    return { success };
  } catch (error) {
    log.error("Failed to delete archived item:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("clear-archive", () => {
  try {
    if (!databaseManager) {
      return { success: false, error: "Database not initialized" };
    }
    databaseManager.clearArchive();
    return { success: true };
  } catch (error) {
    log.error("Failed to clear archive:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("set-retention-period", (_event, days: number) => {
  try {
    configManager?.setRetentionPeriodDays(days);
    return { success: true };
  } catch (error) {
    log.error("Failed to set retention period:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle("archive-old-items", () => {
  try {
    if (!databaseManager || !configManager) {
      return { success: false, error: "Services not initialized" };
    }
    const retentionDays = configManager.getRetentionPeriodDays();
    const count = databaseManager.archiveOldItems(retentionDays);

    // Reload clipboard manager to reflect changes
    clipboardManager?.loadHistoryFromDB();

    return { success: true, count };
  } catch (error) {
    log.error("Failed to archive items:", error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle(
  "semantic-search-archive",
  async (_event, query: string, limit: number = 10) => {
    try {
      if (!databaseManager || !embeddingService) {
        throw new Error("Services not initialized");
      }
      const queryEmbedding = await embeddingService.getEmbedding(query);
      return databaseManager.semanticSearchArchive(queryEmbedding, limit);
    } catch (error) {
      log.error("Failed to perform archive semantic search:", error);
      throw error;
    }
  }
);

function registerGlobalShortcut(shortcut: string = "CommandOrControl+Shift+V") {
  globalShortcut.unregisterAll();

  const registered = globalShortcut.register(shortcut, () => {
    log.info("Global shortcut triggered:", shortcut);
    if (win) {
      if (win.isVisible()) {
        win.hide();
      } else {
        const cursorPoint = screen.getCursorScreenPoint();
        const display = screen.getDisplayNearestPoint(cursorPoint);
        const { x, y, width, height } = display.workArea;

        const winBounds = win.getBounds();
        const newX = Math.round(x + (width - winBounds.width) / 2);
        const newY = Math.round(y + (height - winBounds.height) / 2);

        win.setPosition(newX, newY);
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

  try {
    configManager = new ConfigManager();
    databaseManager = new DatabaseManager();
    embeddingService = new EmbeddingService(configManager);

    const retentionDays = configManager.getRetentionPeriodDays();
    const archivedCount = databaseManager.archiveOldItems(retentionDays);
    log.info(`Auto-archival complete: ${archivedCount} items archived`);

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
  } catch (error) {
    log.error("Failed to start app:", error);
    dialog.showErrorBox(
      "Failed to Start",
      `The application failed to start:\n\n${
        error instanceof Error ? error.message : String(error)
      }`
    );
    app.quit();
  }
});

app.on("window-all-closed", () => {});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
