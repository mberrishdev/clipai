import { app, BrowserWindow, ipcMain, Tray, Menu } from "electron";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ClipboardManager } from "./clipboardManager.ts";
import log from "electron-log";

const __dirname = dirname(fileURLToPath(import.meta.url));

log.transports.file.level = "info";
log.info("App starting...");

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let clipboardManager: ClipboardManager | null = null;
let isQuitting = false;

async function createWindow() {
  log.info("Creating window...");

  win = new BrowserWindow({
    width: 900,
    height: 600,
    show: false,
    transparent: true,
    resizable: false,
    frame: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  log.info("Window created");

  win.on("close", (event) => {
    if (!isQuitting) {
      log.info("Window close prevented, hiding instead");
      event.preventDefault();
      win?.hide();
    }
  });

  win.on("blur", () => {
    log.info("Window lost focus, hiding");
    win?.hide();
  });

  try {
    if (!app.isPackaged) {
      log.info("Loading dev URL: http://localhost:5173");
      await win.loadURL("http://localhost:5173");
    } else {
      const htmlPath = join(__dirname, "../renderer/index.html");
      log.info("Loading file:", htmlPath);
      await win.loadFile(htmlPath);
    }
    log.info("Content loaded successfully");
  } catch (error) {
    log.error("Failed to load content:", error);
  }

  clipboardManager = new ClipboardManager(win);
  clipboardManager.start();
  log.info("ClipboardManager started");
}

function createTray() {
  try {
    const iconPath = join(__dirname, "../../assets/trayIconTemplate.png");
    log.info("Creating tray with icon:", iconPath);
    tray = new Tray(iconPath);
    log.info("Tray created successfully");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show Clipboard History",
        click: () => {
          log.info("=== MENU: Show Clipboard History clicked ===");
          log.info("Window exists:", !!win);
          log.info("Window visible before:", win?.isVisible());
          try {
            win?.show();
            win?.focus();
            log.info("Window visible after:", win?.isVisible());
            win?.webContents.send("navigate", "history");
            log.info("Navigate event sent");
          } catch (error) {
            log.error("Error in menu click:", error);
          }
        },
      },
      {
        label: "Settings",
        click: () => {
          log.info("Menu: Settings clicked");
          win?.show();
          win?.webContents.send("navigate", "settings");
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          log.info("Menu: Quit clicked");
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip("Clipboard Manager");
    log.info("Tray menu configured");

    tray.on("click", () => {
      log.info("Left-click: toggling window");
      const isVisible = win?.isVisible();
      if (isVisible) {
        win?.hide();
      } else {
        win?.show();
        win?.focus();
      }
    });

    tray.on("right-click", () => {
      log.info("Right-click: showing menu");
      tray?.popUpContextMenu(contextMenu);
    });
  } catch (error) {
    log.error("Failed to create tray:", error);
  }
}

ipcMain.handle("get-clipboard-history", () => {
  return clipboardManager?.getHistory() || [];
});

ipcMain.handle("set-transparency", (_event, enabled: boolean) => {
  if (win) {
    // Note: Changing transparency dynamically requires recreating the window
    // For now, we'll just update the CSS class
    win.webContents.send("transparency-changed", enabled);
  }
});

ipcMain.handle("copy-to-clipboard", (_event, text: string) => {
  clipboard.writeText(text);
  log.info("Text copied to clipboard");
  // Auto-hide window after copy
  win?.hide();
});

app.whenReady().then(() => {
  log.info("App ready");
  log.info("isPackaged:", app.isPackaged);
  log.info("__dirname:", __dirname);

  app.setLoginItemSettings({
    openAtLogin: true,
  });

  if (app.dock) {
    log.info("Hiding dock icon");
    app.dock.hide();
  }

  createWindow();
  createTray();

  if (!app.isPackaged) {
    log.info("Dev mode: showing window");
    win?.show();
  }

  log.info("Log file location:", log.transports.file.getFile().path);
});

app.on("window-all-closed", () => {
  // Prevent app from quitting
});
